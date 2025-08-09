import { https } from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Get all permission keys that have admin: true
const adminPermissions = Object.entries(global.saasConfig.permissions)
    .filter(([_, value]) => value.admin)
    .map(([key]) => key);

// Get all available permissions
const availablePermissions = Object.keys(global.saasConfig.permissions);

interface CreateInviteData {
    email: string;
    subscriptionId: string;
    permissions: string[];
}

export const createInvite = https.onCall(async (data: CreateInviteData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to create invites'
        );
    }

    const auth = context.auth;
    const { email, subscriptionId, permissions } = data;

    // Validate required fields
    if (!email || !subscriptionId || !permissions || !Array.isArray(permissions)) {
        throw new https.HttpsError(
            'invalid-argument',
            'Email, subscription ID, and permissions are required'
        );
    }

    // Validate permissions
    if (!permissions.every(p => availablePermissions.includes(p))) {
        throw new https.HttpsError(
            'invalid-argument',
            'Invalid permission level provided'
        );
    }

    const db = getFirestore();
    const normalizedEmail = email.toLowerCase();

    try {
        // Check for existing pending invites
        const existingInvites = await db.collection('invites')
            .where('email', '==', normalizedEmail)
            .where('subscription_id', '==', subscriptionId)
            .where('status', '==', 'pending')
            .get();

        if (!existingInvites.empty) {
            throw new https.HttpsError(
                'already-exists',
                'A pending invite already exists for this email'
            );
        }

        // Check if user exists in Firebase Auth
        try {
            const userRecord = await getAuth().getUserByEmail(normalizedEmail);

            // Check if user is already in the subscription
            const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
            const subscriptionDoc = await subscriptionRef.get();

            if (!subscriptionDoc.exists) {
                throw new https.HttpsError(
                    'not-found',
                    'Subscription not found'
                );
            }

            const subscriptionData = subscriptionDoc.data();
            
            // Check if user has any admin permission level
            const hasAdminPermission = adminPermissions.some(permission => 
                subscriptionData?.permissions[permission]?.includes(auth.uid)
            );

            if (!hasAdminPermission) {
                throw new https.HttpsError(
                    'permission-denied',
                    'User must have admin permission level'
                );
            }

            // Check if user is already in any permission group
            const isUserInSubscription = Object.values(subscriptionData?.permissions || {}).some(
                users => Array.isArray(users) && users.includes(userRecord.uid)
            );

            if (isUserInSubscription) {
                throw new https.HttpsError(
                    'already-exists',
                    'User is already a member of this subscription'
                );
            }

            // Get subscription name from settings
            const subscriptionName = subscriptionData?.settings?.name || 'Untitled Project';

            // Get host user data
            const hostDoc = await db.collection('users').doc(auth.uid).get();
            if (!hostDoc.exists) {
                throw new https.HttpsError(
                    'not-found',
                    'Host user not found'
                );
            }
            const hostData = hostDoc.data();
            const hostName = hostData?.display_name || 'Unknown User';

            // Create the invite document
            const inviteData = {
                create_time: FieldValue.serverTimestamp(),
                email: normalizedEmail,
                subscription_id: subscriptionId,
                subscription_name: subscriptionName,
                host_uid: auth.uid,
                host_name: hostName,
                status: 'pending',
                permissions: permissions
            };

            await db.collection('invites').add(inviteData);
            return { success: true };

        } catch (authError) {
            // User doesn't exist in Firebase Auth, which is fine
            // We can still create the invite for a non-existing user
            
            // Get subscription data
            const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
            const subscriptionDoc = await subscriptionRef.get();

            if (!subscriptionDoc.exists) {
                throw new https.HttpsError(
                    'not-found',
                    'Subscription not found'
                );
            }

            const subscriptionData = subscriptionDoc.data();
            
            // Check if user has any admin permission level
            const hasAdminPermission = adminPermissions.some(permission => 
                subscriptionData?.permissions[permission]?.includes(auth.uid)
            );

            if (!hasAdminPermission) {
                throw new https.HttpsError(
                    'permission-denied',
                    'User must have admin permission level'
                );
            }

            // Get subscription name from settings
            const subscriptionName = subscriptionData?.settings?.name || 'Untitled Project';

            // Get host user data
            const hostDoc = await db.collection('users').doc(auth.uid).get();
            if (!hostDoc.exists) {
                throw new https.HttpsError(
                    'not-found',
                    'Host user not found'
                );
            }
            const hostData = hostDoc.data();
            const hostName = hostData?.display_name || 'Unknown User';

            // Create the invite document
            const inviteData = {
                create_time: FieldValue.serverTimestamp(),
                email: normalizedEmail,
                subscription_id: subscriptionId,
                subscription_name: subscriptionName,
                host_uid: auth.uid,
                host_name: hostName,
                status: 'pending',
                permissions: permissions
            };

            await db.collection('invites').add(inviteData);
            return { success: true };
        }

    } catch (error) {
        console.error('Error creating invite:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to create invite',
            error as Error
        );
    }
});
