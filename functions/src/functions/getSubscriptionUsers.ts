import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { UserDetails, SubscriptionUserDetails, SubscriptionData, UserData, InviteData } from './types';

// Get all permission keys that have admin: true
const adminPermissions = Object.entries(global.saasConfig.permissions)
  .filter(([_, value]) => value.admin)
  .map(([key]) => key);

export const getSubscriptionUsers = onCall(async (request) => {
  const { subscriptionId, page = 1, pageSize = 10 } = request.data;
  const auth = getAuth();
  const db = getFirestore();

  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  try {
    // Get the subscription document
    const subscriptionDoc = await db.collection('subscriptions').doc(subscriptionId).get();
    
    if (!subscriptionDoc.exists) {
      throw new HttpsError('not-found', 'Subscription not found');
    }

    const subscriptionData = subscriptionDoc.data() as SubscriptionData;
    
    // Check if user has any admin permission level
    const hasAdminPermission = adminPermissions.some(permission => 
      subscriptionData.permissions[permission]?.includes(request.auth!.uid)
    );
    
    if (!hasAdminPermission) {
      throw new HttpsError('permission-denied', 'User must have admin permission level');
    }

    // Get all user IDs from permissions
    const userIds = new Set<string>();
    Object.values(subscriptionData.permissions).forEach(users => {
      if (users) {
        users.forEach(userId => userIds.add(userId));
      }
    });

    // Get user details for each user
    const usersPromises = Array.from(userIds).map(async (userId) => {
      try {
        // Get Firebase Auth user data
        const userRecord = await auth.getUser(userId);
        
        // Get additional user data from Firestore
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.exists ? userDoc.data() as UserData : null;

        return {
          id: userId,
          email: userRecord.email || '',
          display_name: userData?.display_name || null,
          avatar_url: userData?.avatar_url || null,
          create_timestamp: userData?.create_timestamp || userRecord.metadata.creationTime ? new Date(userRecord.metadata.creationTime).getTime() : Date.now(),
          permissions: Object.entries(subscriptionData.permissions)
            .filter(([_, users]) => users?.includes(userId))
            .map(([permission]) => permission),
          status: 'active'
        } as UserDetails;
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
        return null;
      }
    });

    // Get pending invites
    const invitesSnapshot = await db.collection('invites')
      .where('subscription_id', '==', subscriptionId)
      .where('status', '==', 'pending')
      .get();

    const pendingUsers = invitesSnapshot.docs.map(doc => {
      const invite = doc.data() as InviteData;
      return {
        id: doc.id,
        email: invite.email,
        display_name: null,
        avatar_url: null,
        create_timestamp: invite.create_time.toMillis(),
        permissions: [],
        pending_permissions: invite.permissions,
        status: 'pending' as const,
        invite_id: doc.id
      } as UserDetails;
    });

    // Combine active users and pending invites
    const activeUsers = (await Promise.all(usersPromises)).filter((user): user is UserDetails => user !== null);
    const allUsers = [...activeUsers, ...pendingUsers];
    const total = allUsers.length;

    // Sort by create timestamp, newest first
    allUsers.sort((a, b) => b.create_timestamp - a.create_timestamp);

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedUsers = allUsers.slice(startIndex, endIndex);

    return {
      users: paginatedUsers,
      total
    } as SubscriptionUserDetails;

  } catch (error) {
    console.error('Error in getSubscriptionUsers:', error);
    if (error instanceof HttpsError) {
      throw error;
    }
    throw new HttpsError('internal', 'Internal server error');
  }
});
