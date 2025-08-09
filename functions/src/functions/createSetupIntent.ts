import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import { stripe } from './stripe';

interface CreateSetupIntentData {
    subscriptionId: string;
}

export const createSetupIntent = https.onCall(async (data: CreateSetupIntentData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to add a payment method'
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
                'Only the subscription owner can add payment methods'
            );
        }

        // Get the Stripe subscription to get the customer ID
        try {
            const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
            
            if (!stripeSubscription.customer) {
                throw new https.HttpsError(
                    'failed-precondition',
                    'No customer found for this subscription'
                );
            }

            // Create a SetupIntent
            const setupIntent = await stripe.setupIntents.create({
                customer: typeof stripeSubscription.customer === 'string' 
                    ? stripeSubscription.customer 
                    : stripeSubscription.customer.id,
                payment_method_types: ['card']
            });

            return {
                success: true,
                clientSecret: setupIntent.client_secret
            };

        } catch (stripeError: any) {
            console.error('Stripe error:', stripeError);
            throw new https.HttpsError(
                'internal',
                stripeError.message || 'Error processing Stripe request'
            );
        }

    } catch (error) {
        console.error('Error creating setup intent:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to create setup intent',
            error as Error
        );
    }
});
