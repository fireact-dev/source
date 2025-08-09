import { https } from 'firebase-functions/v1';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { InviteData, AcceptInviteData } from './types';

export const rejectInvite = https.onCall(async (data: AcceptInviteData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to reject invites'
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

        // Update invite status
        await inviteRef.update({
            status: 'rejected',
            reject_time: Timestamp.now(),
            rejected_by: context.auth.uid
        });

        return { success: true };

    } catch (error) {
        console.error('Error rejecting invite:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to reject invite',
            error as Error
        );
    }
});
