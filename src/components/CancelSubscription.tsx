import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import Message from './Message';
import { useConfig } from '../contexts/ConfigContext';
import { useSubscription } from '../contexts/SubscriptionContext';

export default function CancelSubscription() {
    const [confirmationId, setConfirmationId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { subscription, updateSubscription } = useSubscription();
    const { functions } = useConfig();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subscription) return;

        try {
            setLoading(true);
            setError(null);

            const cancelSubscriptionFn = httpsCallable(functions, 'cancelSubscription');
            await cancelSubscriptionFn({
                subscriptionId: subscription.id,
                confirmationId
            });

            // Update subscription context with canceled status
            updateSubscription({
                ...subscription,
                status: 'canceled'
            });

            // Navigate back to subscription dashboard
            navigate(-1);

        } catch (err: any) {
            console.error('Error cancelling subscription:', err);
            setError(err?.message || t('subscription.cancelError'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
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
                            <h2 className="text-xl font-semibold text-red-600">
                                {t('subscription.cancelSubscription')}
                            </h2>
                        </div>
                        <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
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
            <div className="p-6">
                {error && (
                    <div className="mb-4">
                        <Message type="error">
                            {error}
                        </Message>
                    </div>
                )}

                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-700">
                                {t('subscription.cancelWarning', { id: subscription?.id })}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="confirmationId" className="block text-sm font-medium text-gray-700">
                            {t('subscription.confirmCancellation')}
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                id="confirmationId"
                                value={confirmationId}
                                onChange={(e) => setConfirmationId(e.target.value)}
                                placeholder={subscription?.id}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                required
                            />
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            {t('subscription.cancelConfirmationHelper')}
                        </p>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={!confirmationId || confirmationId !== subscription?.id}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            {t('subscription.confirmCancel')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
