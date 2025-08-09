import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import type { Stripe } from 'stripe';
import { stripe } from './stripe';

interface GetBillingDetailsData {
    subscriptionId: string;
}

export const getBillingDetails = https.onCall(async (data: GetBillingDetailsData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to get billing details'
        );
    }

    const { subscriptionId } = data;
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
                'Only the subscription owner can access billing details'
            );
        }

        // Get customer ID from subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const customerId = subscription.customer as string;

        // Get customer details from Stripe
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer | Stripe.DeletedCustomer;
        
        if ('deleted' in customer) {
            throw new https.HttpsError(
                'not-found',
                'Customer not found'
            );
        }

        return {
            name: customer.name,
            phone: customer.phone,
            address: customer.address
        };

    } catch (error) {
        console.error('Error getting billing details:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to get billing details',
            error as Error
        );
    }
});
