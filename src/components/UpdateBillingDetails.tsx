import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  AddressElement,
  useElements,
} from '@stripe/react-stripe-js';
import type { StripeElementLocale } from '@stripe/stripe-js';
import Message from './common/Message';
import { useConfig } from '../contexts/ConfigContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { httpsCallable } from 'firebase/functions';


let stripePromise: Promise<any> | null = null;

interface BillingDetails {
    name: string | null;
    phone: string | null;
    address: {
        line1: string | null;
        line2: string | null;
        city: string | null;
        state: string | null;
        postal_code: string | null;
        country: string | null;
    } | null;
}

function UpdateBillingForm() {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [elementsReady, setElementsReady] = useState(false);
    const [billingDetails, setBillingDetails] = useState<BillingDetails | null>(null);
    const [initializing, setInitializing] = useState(true);
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { subscription } = useSubscription();
    const { functions } = useConfig();
    const elements = useElements();

    useEffect(() => {
        const fetchBillingDetails = async () => {
            if (!subscription) return;

            try {
                const getBillingDetailsFn = httpsCallable(functions, 'getBillingDetails');
                const result = await getBillingDetailsFn({ subscriptionId: subscription.id });
                setBillingDetails(result.data as BillingDetails);
            } catch (err: any) {
                console.error('Error fetching billing details:', err);
                setError(err?.message || t('subscription.getBillingError'));
            } finally {
                setInitializing(false);
            }
        };

        fetchBillingDetails();
    }, [subscription, functions, t]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!elements || !subscription) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Get billing details from the AddressElement
            const addressElement = elements.getElement('address');
            if (!addressElement) {
                throw new Error('Address element not found');
            }

            const { value: addressData } = await addressElement.getValue();

            const updateBillingDetailsFn = httpsCallable(functions, 'updateBillingDetails');
            await updateBillingDetailsFn({
                subscriptionId: subscription.id,
                name: addressData.name,
                phone: addressData.phone,
                address: {
                    line1: addressData.address.line1,
                    line2: addressData.address.line2,
                    city: addressData.address.city,
                    state: addressData.address.state,
                    postal_code: addressData.address.postal_code,
                    country: addressData.address.country
                }
            });

            // Navigate back to billing page
            navigate(-1);

        } catch (err: any) {
            console.error('Error updating billing details:', err);
            setError(err?.message || t('subscription.updateBillingError'));
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="mb-4">
                    <Message type="error">
                        {error}
                    </Message>
                </div>
            )}

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
                            name: billingDetails?.name || '',
                            phone: billingDetails?.phone || '',
                            address: {
                                line1: billingDetails?.address?.line1 || '',
                                line2: billingDetails?.address?.line2 || '',
                                city: billingDetails?.address?.city || '',
                                state: billingDetails?.address?.state || '',
                                postal_code: billingDetails?.address?.postal_code || '',
                                country: billingDetails?.address?.country || (i18n.language === 'zh' ? 'CN' : 'US'),
                            },
                        },
                    }}
                    onChange={(event) => {
                        if (!elementsReady && event.complete) {
                            setElementsReady(true);
                        }
                    }}
                />
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={loading || !elementsReady}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                    {loading ? t('subscription.processing') : t('subscription.updateBilling')}
                </button>
            </div>
        </form>
    );
}

export default function UpdateBillingDetails() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const config = useConfig();

    // Initialize Stripe only once
    if (!stripePromise) {
        stripePromise = loadStripe(config.appConfig.stripe?.public_api_key || '');
    }

    const options = {
        locale: (i18n.language === 'zh' ? 'zh' : 'en') as StripeElementLocale,
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
        }
    };

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
                <div className="p-6">
                    <div className="sm:flex sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {t('subscription.updateBillingDetails')}
                            </h2>
                        </div>
                        <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {t('ui.back')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-6">
                <Elements stripe={stripePromise} options={options}>
                    <UpdateBillingForm />
                </Elements>
            </div>
        </div>
    );
}
