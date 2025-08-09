import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import type { Stripe } from 'stripe';
import { stripe } from './stripe';

const relevantEvents = new Set([
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'invoice.created',
  'invoice.updated',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.finalized'
]);

export const stripeWebhook = https.onRequest(async (request, response) => {
  try {
    const sig = request.headers['stripe-signature'];

    if (!sig) {
      response.status(400).send('Missing stripe-signature header');
      return;
    }

    const event = stripe.webhooks.constructEvent(
      request.rawBody,
      sig,
      global.saasConfig.stripe.end_point_secret
    );

    if (!relevantEvents.has(event.type)) {
      response.json({ received: true });
      return;
    }

    const db = getFirestore();

    if (event.type.startsWith('customer.subscription.')) {
      const subscription = event.data.object as Stripe.Subscription;
      const subscriptionRef = db.collection('subscriptions').doc(subscription.id);

      // Create stripe_items map (price_id -> subscription_item_id)
      const stripe_items: Record<string, string> = {};
      subscription.items.data.forEach((item) => {
        if (item.price.id) {
          stripe_items[item.price.id] = item.id;
        }
      });

      // Update subscription data in Firestore
      await subscriptionRef.update({
        stripe_customer_id: subscription.customer as string,
        stripe_items: stripe_items,
        subscription_current_period_end: subscription.items.data[0] ? (subscription.items.data[0] as any).current_period_end : null,
        subscription_current_period_start: subscription.items.data[0] ? (subscription.items.data[0] as any).current_period_start : null,
        subscription_end: subscription.ended_at || null,
        subscription_start: subscription.start_date,
        status: subscription.status,
      });
    } else if (event.type.startsWith('invoice.')) {
      const invoice = event.data.object as Stripe.Invoice;
      console.log('Processing invoice event:', event.type, invoice.id);
      
      // Get subscription ID from either direct field or nested parent.subscription_details
      const subscriptionId = typeof invoice.subscription === 'string' ? invoice.subscription : 
                           (invoice as any).parent?.subscription_details?.subscription;
      
      // Only process invoices that are associated with a subscription
      if (subscriptionId && typeof subscriptionId === 'string') {
        console.log('Found associated subscription:', subscriptionId);
        const subscriptionRef = db.collection('subscriptions').doc(subscriptionId);
        console.log('Invoice data:', {
          id: invoice.id,
          amount_due: invoice.amount_due,
          status: invoice.status,
          subscription: subscriptionId
        });
        const invoiceRef = subscriptionRef.collection('invoices').doc(invoice.id);

        // Create invoice data with null checks
        const invoiceData = {
          amount_due: invoice.amount_due || 0,
          amount_paid: invoice.amount_paid || 0,
          amount_remaining: invoice.amount_remaining || 0,
          currency: invoice.currency || 'usd',
          customer: invoice.customer as string,
          customer_email: invoice.customer_email || null,
          customer_name: invoice.customer_name || null,
          description: invoice.description || null,
          hosted_invoice_url: invoice.hosted_invoice_url || null,
          invoice_pdf: invoice.invoice_pdf || null,
          number: invoice.number || null,
          paid: invoice.paid || false,
          payment_intent: invoice.payment_intent as string || null,
          period_end: invoice.period_end || null,
          period_start: invoice.period_start || null,
          status: invoice.status || 'draft',
          subscription_id: subscriptionId,
          total: invoice.total,
          created: invoice.created,
          due_date: invoice.due_date,
          updated: Math.floor(Date.now() / 1000)
        };

        // Set or update invoice data
        await invoiceRef.set(invoiceData, { merge: true });

        // If the invoice is paid, update the subscription's latest_invoice field
        if (invoice.status === 'paid') {
          await subscriptionRef.update({
            latest_invoice: invoice.id
          });
        }
      }
    }

    response.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    response.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
});
