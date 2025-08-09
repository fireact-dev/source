import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';

// Get all permission keys that have admin: true
const adminPermissions = Object.entries(global.saasConfig.permissions)
    .filter(([_, value]) => value.admin)
    .map(([key]) => key);

interface RemoveUserData {
    userId: string;
    subscriptionId: string;
}

export const removeUser = https.onCall(async (data: RemoveUserData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to remove users'
        );
    }

    const { userId, subscriptionId } = data;
    if (!userId || !subscriptionId) {
        throw new https.HttpsError(
            'invalid-argument',
            'User ID and subscription ID are required'
        );
    }

    const db = getFirestore();

    try {
        // Get the subscription document
        const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
        const subscriptionDoc = await subscriptionRef.get();

        if (!subscriptionDoc.exists) {
            throw new https.HttpsError(
                'not-found',
                'Subscription not found'
            );
        }

        const subscriptionData = subscriptionDoc.data();
        if (!subscriptionData) {
            throw new https.HttpsError(
                'not-found',
                'Subscription data not found'
            );
        }

        // Check if user has any admin permission level
        const hasAdminPermission = adminPermissions.some(permission => 
            subscriptionData.permissions?.[permission]?.includes(context.auth!.uid)
        );

        if (!hasAdminPermission) {
            throw new https.HttpsError(
                'permission-denied',
                'User must have admin permission level'
            );
        }

        // Check if trying to remove an owner
        const isOwner = adminPermissions.some(permission => 
            subscriptionData.permissions?.[permission]?.includes(userId)
        );

        if (isOwner) {
            throw new https.HttpsError(
                'permission-denied',
                'Cannot remove subscription owner'
            );
        }

        // Remove user from all permission groups
        const updatedPermissions = { ...subscriptionData.permissions };
        Object.keys(updatedPermissions).forEach(permission => {
            if (Array.isArray(updatedPermissions[permission])) {
                updatedPermissions[permission] = updatedPermissions[permission].filter(
                    (uid: string) => uid !== userId
                );
            }
        });

        // Update subscription permissions
        await subscriptionRef.update({
            permissions: updatedPermissions
        });

        return { success: true };

    } catch (error) {
        console.error('Error removing user:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to remove user',
            error as Error
        );
    }
});
