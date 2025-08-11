import Stripe from 'stripe';

export const stripe = new Stripe(global.saasConfig.stripe.secret_api_key, {
    apiVersion: "2025-07-30.basil"
});
