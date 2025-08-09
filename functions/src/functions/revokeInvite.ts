import { https } from 'firebase-functions/v1';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { InviteData } from './types';

// Get all permission keys that have admin: true
const adminPermissions = Object.entries(global.saasConfig.permissions)
    .filter(([_, value]) => value.admin)
    .map(([key]) => key);

interface RevokeInviteData {
    inviteId: string;
    subscriptionId: string;
}

export const revokeInvite = https.onCall(async (data: RevokeInviteData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to revoke invites'
        );
    }

    const { inviteId, subscriptionId } = data;
    if (!inviteId || !subscriptionId) {
        throw new https.HttpsError(
            'invalid-argument',
            'Invite ID and subscription ID are required'
        );
    }

    const db = getFirestore();

    try {
        // Check if user has admin permission in the subscription
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
            subscriptionData?.permissions[permission]?.includes(context.auth!.uid)
        );

        if (!hasAdminPermission) {
            throw new https.HttpsError(
                'permission-denied',
                'User must have admin permission level'
            );
        }

        // Get the invite document
        const inviteRef = db.collection('invites').doc(inviteId);
        const inviteDoc = await inviteRef.get();

        if (!inviteDoc.exists) {
            throw new https.HttpsError(
                'not-found',
                'Invite not found'
            );
        }

        const inviteData = inviteDoc.data() as InviteData;

        // Verify invite belongs to this subscription
        if (inviteData.subscription_id !== subscriptionId) {
            throw new https.HttpsError(
                'permission-denied',
                'Invite does not belong to this subscription'
            );
        }

        // Verify invite is pending
        if (inviteData.status !== 'pending') {
            throw new https.HttpsError(
                'failed-precondition',
                'Only pending invites can be revoked'
            );
        }

        // Update invite status
        await inviteRef.update({
            status: 'revoked',
            revoke_time: Timestamp.now(),
            revoked_by: context.auth.uid
        });

        return { success: true };

    } catch (error) {
        console.error('Error revoking invite:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to revoke invite',
            error as Error
        );
    }
});
