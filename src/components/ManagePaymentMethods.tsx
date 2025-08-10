import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import Message from './common/Message';
import { useConfig } from '../contexts/ConfigContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { loadStripe } from '@stripe/stripe-js';
import {
    Elements,
    PaymentElement,
    useStripe,
    useElements
} from '@stripe/react-stripe-js';


interface PaymentMethod {
    id: string;
    card: {
        brand: string;
        last4: string;
        exp_month: number;
        exp_year: number;
    };
    isDefault?: boolean;
}

// Loading spinner component
function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
    );
}

// Card input form component
function AddPaymentMethodForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await stripe.confirmSetup({
                elements,
                confirmParams: {
                    return_url: window.location.href,
                }
            });

            if (result.error) {
                setError(result.error.message || t('subscription.paymentMethodAddError'));
            } else {
                onSuccess();
            }
        } catch (err: any) {
            setError(err?.message || t('subscription.paymentMethodAddError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div className="mb-4">
                    <Message type="error">
                        {error}
                    </Message>
                </div>
            )}
            
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                        {t('subscription.cardInformation')}
                    </h3>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <PaymentElement options={{
                            layout: {
                                type: 'tabs',
                                defaultCollapsed: false
                            },
                            paymentMethodOrder: ['card']
                        }} />
                    </div>
                </div>

                <div className="flex justify-end space-x-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={loading}
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={loading || !stripe || !elements}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? t('saving') : t('save')}
                    </button>
                </div>
            </div>
        </form>
    );
}

// Main component
export default function ManagePaymentMethods() {
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loadingSetupIntent, setLoadingSetupIntent] = useState(false);
    const [setupIntent, setSetupIntent] = useState<{ clientSecret: string } | null>(null);
    const [settingDefault, setSettingDefault] = useState<string | null>(null);
    const [deletingCard, setDeletingCard] = useState<string | null>(null);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { subscription } = useSubscription();
    const config = useConfig();
    const stripePromise = loadStripe(config.appConfig.stripe?.public_api_key || '');

    const fetchPaymentMethods = async () => {
        if (!subscription) return;

        try {
            setLoading(true);
            setError(null);

            const getPaymentMethodsFn = httpsCallable(config.functions, 'getPaymentMethods');
            const result = await getPaymentMethodsFn({
                subscriptionId: subscription.id
            });

            setPaymentMethods((result.data as any).paymentMethods);
        } catch (err: any) {
            console.error('Error fetching payment methods:', err);
            setError(err?.message || t('subscription.paymentMethodsError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPaymentMethods();
    }, [subscription, config.functions, t]);

    const handleAddClick = async () => {
        if (!subscription) return;

        try {
            setError(null);
            setShowAddForm(true);
            setLoadingSetupIntent(true);
            const createSetupIntentFn = httpsCallable(config.functions, 'createSetupIntent');
            const result = await createSetupIntentFn({
                subscriptionId: subscription.id
            });

            setSetupIntent((result.data as any));
        } catch (err: any) {
            console.error('Error creating setup intent:', err);
            setError(err?.message || t('subscription.paymentMethodAddError'));
            setShowAddForm(false);
        } finally {
            setLoadingSetupIntent(false);
        }
    };

    const handleAddSuccess = () => {
        setShowAddForm(false);
        setSetupIntent(null);
        fetchPaymentMethods();
    };

    const handleSetDefault = async (paymentMethodId: string) => {
        if (!subscription) return;

        try {
            setError(null);
            setSettingDefault(paymentMethodId);
            const setDefaultFn = httpsCallable(config.functions, 'setDefaultPaymentMethod');
            await setDefaultFn({
                subscriptionId: subscription.id,
                paymentMethodId
            });

            await fetchPaymentMethods();
        } catch (err: any) {
            console.error('Error setting default payment method:', err);
            setError(err?.message || t('subscription.setDefaultError'));
        } finally {
            setSettingDefault(null);
        }
    };

    const handleDelete = async (paymentMethodId: string) => {
        if (!subscription) return;

        try {
            setError(null);
            setDeletingCard(paymentMethodId);
            const deleteCardFn = httpsCallable(config.functions, 'deletePaymentMethod');
            await deleteCardFn({
                subscriptionId: subscription.id,
                paymentMethodId
            });

            await fetchPaymentMethods();
        } catch (err: any) {
            console.error('Error deleting payment method:', err);
            setError(err?.message || t('subscription.deleteCardError'));
        } finally {
            setDeletingCard(null);
        }
    };

    const getCardIcon = (brand: string) => {
        switch (brand.toLowerCase()) {
            case 'visa':
                return (
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M21.5,12A9.5,9.5 0 0,1 12,21.5A9.5,9.5 0 0,1 2.5,12A9.5,9.5 0 0,1 12,2.5A9.5,9.5 0 0,1 21.5,12M12.5,6.9L9.8,14H7.7L6.3,8.4C6.2,8 6,7.8 5.7,7.7C5.1,7.5 4.3,7.3 3.5,7.2L3.6,6.9H7.4C7.8,6.9 8.1,7.2 8.2,7.6L8.9,11.1L10.7,6.9H12.5M15.9,14H14.1L12.7,6.9H14.5L15.9,14M18.5,14H16.7L17.7,6.9H19.5L18.5,14Z" />
                    </svg>
                );
            case 'mastercard':
                return (
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M7.7,15.5C7.7,15.5 7,15.5 7,14.8C7,14.1 7.7,14.1 7.7,14.1H16.3C16.3,14.1 17,14.1 17,14.8C17,15.5 16.3,15.5 16.3,15.5H7.7M7.7,12.5C7.7,12.5 7,12.5 7,11.8C7,11.1 7.7,11.1 7.7,11.1H16.3C16.3,11.1 17,11.1 17,11.8C17,12.5 16.3,12.5 16.3,12.5H7.7M7.7,9.5C7.7,9.5 7,9.5 7,8.8C7,8.1 7.7,8.1 7.7,8.1H16.3C16.3,8.1 17,8.1 17,8.8C17,9.5 16.3,9.5 16.3,9.5H7.7Z" />
                    </svg>
                );
            default:
                return (
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20,8H4V6H20M20,18H4V12H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z" />
                    </svg>
                );
        }
    };

    if (loading && !showAddForm) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
                <div className="p-6">
                    <div className="sm:flex sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                {t('subscription.managePaymentMethods')}
                            </h2>
                        </div>
                        <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0 space-y-4 sm:space-y-0 sm:space-x-4">
                            {!showAddForm && (
                                <button
                                    onClick={handleAddClick}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {t('subscription.addPaymentMethod')}
                                </button>
                            )}
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {t('back')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-6">
                {error && (
                    <div className="mb-4">
                        <Message type="error">
                            {error}
                        </Message>
                    </div>
                )}

                {showAddForm && (
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        {loadingSetupIntent ? (
                            <LoadingSpinner />
                        ) : setupIntent && (
                            <Elements stripe={stripePromise} options={{
                                clientSecret: setupIntent.clientSecret,
                                appearance: {
                                    theme: 'stripe'
                                }
                            }}>
                                <AddPaymentMethodForm
                                    onSuccess={handleAddSuccess}
                                    onCancel={() => {
                                        setShowAddForm(false);
                                        setSetupIntent(null);
                                    }}
                                />
                            </Elements>
                        )}
                    </div>
                )}

                {paymentMethods.length === 0 && !showAddForm ? (
                    <div className="text-center py-6 text-gray-500">
                        {t('subscription.noPaymentMethods')}
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {paymentMethods.map((method) => (
                            <div
                                key={method.id}
                                className="relative p-6 bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg text-white overflow-hidden"
                            >
                                {/* Default badge */}
                                {method.isDefault && (
                                    <div className="absolute top-4 right-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                            {t('subscription.defaultPaymentMethod')}
                                        </span>
                                    </div>
                                )}

                                {/* Card brand and icon */}
                                <div className="flex items-center space-x-2">
                                    <div className="text-white">
                                        {getCardIcon(method.card.brand)}
                                    </div>
                                    <span className="text-sm font-medium">
                                        {method.card.brand.charAt(0).toUpperCase() + method.card.brand.slice(1)}
                                    </span>
                                </div>

                                {/* Card number */}
                                <div className="mt-8 mb-8">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">••••</span>
                                        <span className="text-lg">••••</span>
                                        <span className="text-lg">••••</span>
                                        <span className="text-lg">{method.card.last4}</span>
                                    </div>
                                </div>

                                {/* Card details and actions */}
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Expires</p>
                                        <p className="text-sm">
                                            {method.card.exp_month.toString().padStart(2, '0')}/{method.card.exp_year.toString().slice(-2)}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        {!method.isDefault && (
                                            <>
                                                <button
                                                    onClick={() => handleSetDefault(method.id)}
                                                    disabled={settingDefault === method.id}
                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                                                >
                                                    {settingDefault === method.id ? t('subscription.settingDefault') : t('subscription.setAsDefault')}
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(method.id)}
                                                    disabled={deletingCard === method.id}
                                                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-red-500 disabled:bg-red-400 disabled:cursor-not-allowed"
                                                >
                                                    {deletingCard === method.id ? t('subscription.deletingCard') : t('subscription.deleteCard')}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
