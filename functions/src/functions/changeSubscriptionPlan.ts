import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import type { Stripe } from 'stripe';
import { stripe } from './stripe';

interface ChangeSubscriptionPlanData {
    subscriptionId: string;
    planId: string;
    billingInfo?: {
        billingDetails: any;
        paymentMethodId: string;
    };
}

export const changeSubscriptionPlan = https.onCall(async (data: ChangeSubscriptionPlanData, context) => {
    // Check if user is authenticated
    if (!context.auth) {
        throw new https.HttpsError(
            'unauthenticated',
            'User must be authenticated to change subscription plan'
        );
    }

    const { subscriptionId, planId, billingInfo } = data;
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
                'Only the subscription owner can change the subscription plan'
            );
        }

        // Get the new plan
        const plan = global.saasConfig.plans.find(p => p.id === planId);
        if (!plan) {
            throw new https.HttpsError(
                'invalid-argument',
                'Invalid plan ID provided'
            );
        }

        // Get the Stripe subscription
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price']
        });

        // If billing info provided, update customer
        if (billingInfo) {
            // First attach the payment method to the customer
            await stripe.paymentMethods.attach(billingInfo.paymentMethodId, {
                customer: stripeSubscription.customer as string,
            });

            // Then update customer with billing details and payment method
            await stripe.customers.update(stripeSubscription.customer as string, {
                ...billingInfo.billingDetails,
                invoice_settings: {
                    default_payment_method: billingInfo.paymentMethodId,
                },
            });
        }

        // Add new subscription items
        const newItems = await Promise.all(
            plan.priceIds.map(priceId =>
                stripe.subscriptionItems.create({
                    subscription: subscriptionId,
                    price: priceId
                })
            )
        );

        // Delete existing subscription items
        await Promise.all(
            stripeSubscription.items.data.map(async (item) => {
                const price = item.price as Stripe.Price;
                const deleteOptions: Stripe.SubscriptionItemDeleteParams = {};
                
                // Only set clear_usage for metered prices
                if (price.recurring?.usage_type === 'metered') {
                    deleteOptions.clear_usage = true;
                }
                
                return stripe.subscriptionItems.del(item.id, deleteOptions);
            })
        );

        // Create new stripe_items object with only the new items
        const newStripeItems = Object.fromEntries(
            newItems.map(item => [
                item.price?.id || '',
                item.id
            ])
        );

        // Update subscription data in Firestore with only new items
        await subscriptionRef.update({
            plan_id: planId,
            stripe_items: newStripeItems
        });

        return {
            success: true,
            subscriptionId
        };

    } catch (error) {
        console.error('Error changing subscription plan:', error);
        if (error instanceof https.HttpsError) {
            throw error;
        }
        throw new https.HttpsError(
            'internal',
            'Failed to change subscription plan',
            error as Error
        );
    }
});
