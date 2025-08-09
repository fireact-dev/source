import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import type { Stripe } from 'stripe';
import { stripe } from './stripe';

interface DeletePaymentMethodData {
    subscriptionId: string;
    paymentMethodId: string;
}

export const deletePaymentMethod = https.onCall(async (data: DeletePaymentMethodData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to delete payment method'
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
                'Only the subscription owner can delete payment methods'
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

        // Check if this is the default payment method
        const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer | Stripe.DeletedCustomer;
        if (!('deleted' in customer)) {
            const defaultPaymentMethodId = typeof customer.invoice_settings?.default_payment_method === 'string'
                ? customer.invoice_settings.default_payment_method
                : null;

            if (defaultPaymentMethodId === paymentMethodId) {
                throw new https.HttpsError(
                    'failed-precondition',
                    'Cannot delete default payment method'
                );
            }
        }

        // Detach the payment method from the customer
        await stripe.paymentMethods.detach(paymentMethodId);

        return {
            success: true
        };

    } catch (error) {
        console.error('Error deleting payment method:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to delete payment method',
            error as Error
        );
    }
});
