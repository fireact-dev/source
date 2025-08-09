import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import { stripe } from './stripe';

interface UpdateBillingDetailsData {
    subscriptionId: string;
    name: string;
    phone: string;
    address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
    };
}

export const updateBillingDetails = https.onCall(async (data: UpdateBillingDetailsData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to update billing details'
        );
    }

    const { subscriptionId, name, phone, address } = data;
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
                'Only the subscription owner can update billing details'
            );
        }

        // Get customer ID from subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;

        // Update customer billing details in Stripe
        await stripe.customers.update(customerId, {
            name,
            phone,
            address
        });

        return {
            success: true,
            subscriptionId
        };

    } catch (error) {
        console.error('Error updating billing details:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to update billing details',
            error as Error
        );
    }
});
