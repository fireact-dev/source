import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import { stripe } from './stripe';

interface SetDefaultPaymentMethodData {
    subscriptionId: string;
    paymentMethodId: string;
}

export const setDefaultPaymentMethod = https.onCall(async (data: SetDefaultPaymentMethodData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to set default payment method'
        );
    }

    const { subscriptionId, paymentMethodId } = data;
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
                'Only the subscription owner can set default payment method'
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

        // Update the customer's default payment method
        await stripe.customers.update(customerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId
            }
        });

        return {
            success: true
        };

    } catch (error) {
        console.error('Error setting default payment method:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to set default payment method',
            error as Error
        );
    }
});
