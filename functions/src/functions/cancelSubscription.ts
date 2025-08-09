import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import { stripe } from './stripe';

interface CancelSubscriptionData {
    subscriptionId: string;
    confirmationId: string;
}

export const cancelSubscription = https.onCall(async (data: CancelSubscriptionData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to cancel subscription'
        );
    }

    const { subscriptionId, confirmationId } = data;
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

        // Check if user is the subscription owner
        if (subscriptionData?.owner_id !== context.auth.uid) {
            throw new https.HttpsError(
                'permission-denied',
                'Only the subscription owner can cancel the subscription'
            );
        }

        // Verify the confirmation ID matches the subscription ID
        if (confirmationId !== subscriptionId) {
            throw new https.HttpsError(
                'invalid-argument',
                'Invalid confirmation ID'
            );
        }

        // Cancel the Stripe subscription
        await stripe.subscriptions.cancel(subscriptionId);

        // Update subscription status in Firestore
        await subscriptionRef.update({
            status: 'canceled',
            subscription_end: Date.now() / 1000 // Current timestamp in seconds
        });

        return {
            success: true,
            subscriptionId
        };

    } catch (error) {
        console.error('Error cancelling subscription:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to cancel subscription',
            error as Error
        );
    }
});
