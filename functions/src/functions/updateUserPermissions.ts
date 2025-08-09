import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';

// Get all permission keys that have admin: true
const adminPermissions = Object.entries(global.saasConfig.permissions)
    .filter(([_, value]) => value.admin)
    .map(([key]) => key);

// Get permission key that has default: true
const defaultPermission = Object.entries(global.saasConfig.permissions)
    .find(([_, value]) => value.default)?.[0];

interface UpdateUserPermissionsData {
    userId: string;
    subscriptionId: string;
    permissions: string[];
}

export const updateUserPermissions = https.onCall(async (data: UpdateUserPermissionsData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to update permissions'
        );
    }

    const { userId, subscriptionId, permissions } = data;
    if (!userId || !subscriptionId || !Array.isArray(permissions)) {
        throw new https.HttpsError(
            'invalid-argument',
            'User ID, subscription ID, and permissions array are required'
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

        // Ensure default permission is included
        if (defaultPermission && !permissions.includes(defaultPermission)) {
            permissions.push(defaultPermission);
        }

        // Validate all permissions exist in config
        if (!permissions.every(permission => permission in global.saasConfig.permissions)) {
            throw new https.HttpsError(
                'invalid-argument',
                'Invalid permission provided'
            );
        }

        // Update user permissions
        const updatedPermissions = { ...subscriptionData.permissions };
        Object.keys(global.saasConfig.permissions).forEach(permission => {
            if (!Array.isArray(updatedPermissions[permission])) {
                updatedPermissions[permission] = [];
            }
            
            if (permissions.includes(permission)) {
                // Add user to permission group if not already present
                if (!updatedPermissions[permission].includes(userId)) {
                    updatedPermissions[permission].push(userId);
                }
            } else {
                // Remove user from permission group
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
        console.error('Error updating user permissions:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to update user permissions',
            error as Error
        );
    }
});
