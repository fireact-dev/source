import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
  AddressElement
} from '@stripe/react-stripe-js';
import type { StripeElementLocale } from '@stripe/stripe-js';
import { useConfig } from '../../contexts/ConfigContext';
import type { Plan } from '../../types';


let stripePromise: Promise<any> | null = null;

interface BillingFormProps {
  plan: Plan;
  onSubmit: (paymentMethodId: string, billingDetails: any) => Promise<void>;
}

function CheckoutForm({ plan, onSubmit }: { plan: Plan; onSubmit: BillingFormProps['onSubmit'] }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [elementsReady, setElementsReady] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (stripe && elements) {
    }
  }, [stripe, elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First, trigger form validation and collection
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message || 'Failed to submit payment details');
      }

      // Then create the payment method
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
        params: {
          type: 'card',
        },
      });

      if (createError) {
        throw new Error(createError.message || 'Failed to create payment method');
      }

      if (!paymentMethod) {
        throw new Error('No payment method created');
      }

      // Get billing details from the AddressElement
      const addressElement = elements.getElement('address');
      if (!addressElement) {
        throw new Error('Address element not found');
      }

      const { value: addressData } = await addressElement.getValue();

      // Return payment method and billing details to parent
      await onSubmit(paymentMethod.id, addressData);

    } catch (err) {
      console.error('Payment error:', err);
      setError((err as Error).message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div className="text-center p-4">
        {t('subscription.loading')}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <AddressElement 
          options={{
            mode: 'billing',
            fields: {
              phone: 'always',
            },
            validation: {
              phone: {
                required: 'always',
              },
            },
            display: {
              name: 'full',
            },
            defaultValues: {
              name: '',
              phone: '',
              address: {
                line1: '',
                line2: '',
                city: '',
                state: '',
                postal_code: '',
                country: i18n.language === 'zh' ? 'CN' : 'US',
              },
            },
          }}
          onChange={(event) => {
            if (!elementsReady && event.complete) {
              setElementsReady(true);
            }
          }}
        />

        <PaymentElement 
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false
            },
            fields: {
              billingDetails: 'auto'
            }
          }}
          onReady={() => {
            setElementsReady(true);
          }}
        />
      </div>
      {error && (
        <div className="text-red-600 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || !elements || loading || !elementsReady}
        className="w-full bg-indigo-600 text-white rounded-md px-3 py-2 text-sm font-semibold 
                 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 
                 focus-visible:outline-offset-2 focus-visible:outline-indigo-600
                 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        {loading ? t('subscription.processing') : 
         !elementsReady ? t('subscription.loading') : 
         t('subscription.submit')}
      </button>
    </form>
  );
}

export default function BillingForm({ plan, onSubmit }: BillingFormProps) {
  const { t, i18n } = useTranslation();
  const config = useConfig();

  // Initialize Stripe only once
  if (!stripePromise) {
    stripePromise = loadStripe(config.appConfig.stripe?.public_api_key || '');
  }

  const options = {
    mode: 'subscription' as const,
    amount: plan.price * 100, // convert to cents
    currency: 'usd',
    locale: t('stripeLocale') as StripeElementLocale,
    paymentMethodCreation: 'manual' as const,
    appearance: {
      theme: 'stripe' as const,
      labels: 'floating' as const,
      variables: {
        colorPrimary: '#4F46E5',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#df1b41',
        fontFamily: i18n.language === 'zh' ? 
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei"' :
          'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px'
      }
    },
    paymentElementOptions: {
      layout: {
        type: 'tabs',
        defaultCollapsed: false
      }
    }
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm plan={plan} onSubmit={onSubmit} />
    </Elements>
  );
}
