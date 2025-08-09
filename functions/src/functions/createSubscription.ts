import { https } from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { Stripe } from 'stripe';
import { stripe } from './stripe';

interface CreateSubscriptionData {
  planId: string;
  billingInfo?: {
    billingDetails: any;
    paymentMethodId: string;
  };
}

export const createSubscription = https.onCall(async (data: CreateSubscriptionData, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new https.HttpsError(
      'unauthenticated',
      'User must be authenticated to create a subscription'
    );
  }

  const userEmail = context.auth.token.email;
  const userId = context.auth.uid;

  if (!userEmail) {
    throw new https.HttpsError(
      'failed-precondition',
      'User must have an email address'
    );
  }

  const db = getFirestore();

  try {
    // Find the plan in saasConfig
    const plan = global.saasConfig.plans.find(p => p.id === data.planId);
    if (!plan) {
      throw new https.HttpsError(
        'invalid-argument',
        'Invalid plan ID provided'
      );
    }

    // Create customer with billing details if provided, otherwise just email
    const customerParams: Stripe.CustomerCreateParams = data.billingInfo ? {
      email: userEmail,
      ...data.billingInfo.billingDetails,
      payment_method: data.billingInfo.paymentMethodId,
      invoice_settings: {
        default_payment_method: data.billingInfo.paymentMethodId,
      },
    } : {
      email: userEmail,
      name: context.auth.token.name || userEmail,
    };

    const customer = await stripe.customers.create(customerParams);

    // Create the subscription
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: customer.id,
      items: plan.priceIds.map(priceId => ({ price: priceId })),
      payment_settings: {
        payment_method_types: ['card'],
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    };

    const subscription = await stripe.subscriptions.create(subscriptionParams);
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

    // Create permissions object based on config
    const permissions: Record<string, string[]> = {};
    Object.entries(global.saasConfig.permissions).forEach(([key, value]) => {
      if (value.default || value.admin) {
        permissions[key] = [userId];
      }
    });

    // Create stripe_items map (price_id -> subscription_item_id)
    const stripe_items: Record<string, string> = {};
    subscription.items.data.forEach((item) => {
      if (item.price.id) {
        stripe_items[item.price.id] = item.id;
      }
    });

    // Write subscription data to Firestore
    await db.collection('subscriptions').doc(subscription.id).set({
      creation_time: FieldValue.serverTimestamp(),
      owner_id: userId,
      plan_id: data.planId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customer.id,
      status: subscription.status,
      subscription_current_period_start: subscription.current_period_start,
      subscription_current_period_end: subscription.current_period_end,
      subscription_start: subscription.start_date,
      subscription_end: subscription.ended_at || null,
      permissions: permissions,
      stripe_items: stripe_items
    });

    // Only return client_secret if payment requires confirmation
    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent?.status === 'requires_payment_method' || paymentIntent?.status === 'requires_confirmation' ? 
        paymentIntent.client_secret : null,
      customerId: customer.id,
    };

  } catch (error) {
    console.error('Subscription creation error:', error);
    if (error instanceof https.HttpsError) {
      throw error;
    }
    throw new https.HttpsError(
      'internal',
      'Unable to create subscription',
      error as Error
    );
  }
});
