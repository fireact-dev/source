import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import type { Stripe } from 'stripe';
import { stripe } from './stripe';

interface GetPaymentMethodsData {
    subscriptionId: string;
}

export const getPaymentMethods = https.onCall(async (data: GetPaymentMethodsData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to view payment methods'
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
                'Only the subscription owner can view payment methods'
            );
        }

        // Get the Stripe subscription to get the customer ID
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        if (!stripeSubscription.customer) {
            throw new https.HttpsError(
                'failed-precondition',
                'No customer found for this subscription'
            );
        }

        const customerId = typeof stripeSubscription.customer === 'string' 
            ? stripeSubscription.customer 
            : stripeSubscription.customer.id;

        // Get the customer's default payment method
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer | Stripe.DeletedCustomer;
        let defaultPaymentMethodId: string | null = null;

        if (!('deleted' in customer)) {
            defaultPaymentMethodId = typeof customer.invoice_settings?.default_payment_method === 'string' 
                ? customer.invoice_settings.default_payment_method 
                : null;
        }

        // Get all payment methods for the customer
        const paymentMethods = await stripe.paymentMethods.list({
            customer: customerId,
            type: 'card'
        });

        // Mark the default payment method
        const paymentMethodsWithDefault = paymentMethods.data.map(method => ({
            ...method,
            isDefault: method.id === defaultPaymentMethodId
        }));

        return {
            success: true,
            paymentMethods: paymentMethodsWithDefault
        };

    } catch (error) {
        console.error('Error getting payment methods:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to get payment methods',
            error as Error
        );
    }
});
