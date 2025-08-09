import { https } from 'firebase-functions/v1';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { UserPermissions, InviteData, AcceptInviteData } from './types';

export const acceptInvite = https.onCall(async (data: AcceptInviteData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to accept invites'
        );
    }

    const { inviteId } = data;
    if (!inviteId) {
        throw new https.HttpsError(
            'invalid-argument',
            'Invite ID is required'
        );
    }

    const db = getFirestore();

    try {
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

        // Verify invite is pending and for the current user
        if (inviteData?.status !== 'pending') {
            throw new https.HttpsError(
                'failed-precondition',
                'Invite is no longer pending'
            );
        }

        if (inviteData.email.toLowerCase() !== context.auth.token.email?.toLowerCase()) {
            throw new https.HttpsError(
                'permission-denied',
                'This invite is for a different user'
            );
        }

        // Get the subscription document
        const subscriptionRef = db.collection('subscriptions').doc(inviteData.subscription_id);
        const subscriptionDoc = await subscriptionRef.get();

        if (!subscriptionDoc.exists) {
            throw new https.HttpsError(
                'not-found',
                'Subscription not found'
            );
        }

        // Start a transaction to update both documents
        await db.runTransaction(async (transaction) => {
            const subscriptionData = subscriptionDoc.data();
            const updatedPermissions: UserPermissions = { ...subscriptionData?.permissions };

            // Add user to each permission group from the invite
            inviteData.permissions.forEach((permission: string) => {
                if (!updatedPermissions[permission]) {
                    updatedPermissions[permission] = [];
                }
                if (!updatedPermissions[permission]?.includes(context.auth!.uid)) {
                    updatedPermissions[permission]?.push(context.auth!.uid);
                }
            });

            // Update subscription permissions
            transaction.update(subscriptionRef, {
                permissions: updatedPermissions
            });

            // Update invite status
            transaction.update(inviteRef, {
                status: 'accepted',
                accept_time: Timestamp.now(),
                accepted_by: context.auth!.uid
            });
        });

        return { success: true };

    } catch (error) {
        console.error('Error accepting invite:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to accept invite',
            error as Error
        );
    }
});
