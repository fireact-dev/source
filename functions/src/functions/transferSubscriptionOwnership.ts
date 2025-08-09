import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { stripe } from './stripe';

interface TransferSubscriptionData {
    subscriptionId: string;
    newOwnerId: string;
}

export const transferSubscriptionOwnership = https.onCall(async (data: TransferSubscriptionData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to transfer subscription'
        );
    }

    const { subscriptionId, newOwnerId } = data;
    const db = getFirestore();
    const auth = getAuth();

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
                'Only the subscription owner can transfer the subscription'
            );
        }

        // Get the stripe_customer_id from subscription data
        const stripeCustomerId = subscriptionData?.stripe_customer_id;
        if (!stripeCustomerId) {
            throw new https.HttpsError(
                'failed-precondition',
                'No Stripe customer ID found for subscription'
            );
        }

        // Get the new owner's auth data to get their email
        const newOwnerAuth = await auth.getUser(newOwnerId);
        const newOwnerEmail = newOwnerAuth.email;

        if (!newOwnerEmail) {
            throw new https.HttpsError(
                'failed-precondition',
                'New owner must have an email address'
            );
        }

        // Update the Stripe customer email
        await stripe.customers.update(stripeCustomerId, {
            email: newOwnerEmail
        });

        // Update subscription owner in Firestore
        await subscriptionRef.update({
            owner_id: newOwnerId
        });

        return {
            success: true,
            subscriptionId,
            newOwnerId,
            stripeCustomerId
        };

    } catch (error) {
        console.error('Error transferring subscription ownership:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to transfer subscription ownership',
            error as Error
        );
    }
});
