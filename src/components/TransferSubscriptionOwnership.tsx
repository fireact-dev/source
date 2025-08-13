import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import Message from './common/Message';
import { useConfig } from '../contexts/ConfigContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { type UserDetails } from '../types';

export default function TransferSubscriptionOwnership() {
    const [newOwnerId, setNewOwnerId] = useState('');
    const [adminUsers, setAdminUsers] = useState<UserDetails[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { subscription, updateSubscription } = useSubscription();
    const { functions } = useConfig();

    useEffect(() => {
        const fetchAdminUsers = async () => {
            if (!subscription) return;

            try {
                setLoading(true);
                const getSubscriptionUsersFn = httpsCallable(functions, 'getSubscriptionUsers');
                const result = await getSubscriptionUsersFn({ subscriptionId: subscription.id });
                const data = result.data as { users: UserDetails[] };
                
                // Filter for admin users only, excluding the current owner
                const adminUsers = data.users.filter(user => 
                    user.permissions.includes('admin') && 
                    user.id !== subscription.owner_id &&
                    user.status === 'active'
                );
                
                setAdminUsers(adminUsers);
            } catch (err: any) {
                console.error('Error fetching admin users:', err);
                setError(err?.message || t('subscription.fetchUsersError'));
            } finally {
                setLoading(false);
            }
        };

        fetchAdminUsers();
    }, [subscription, functions, t]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subscription || !newOwnerId) return;

        try {
            setLoading(true);
            setError(null);

            const transferSubscriptionFn = httpsCallable(functions, 'transferSubscriptionOwnership');
            await transferSubscriptionFn({
                subscriptionId: subscription.id,
                newOwnerId
            });

            // Update subscription context with new owner
            updateSubscription({
                ...subscription,
                owner_id: newOwnerId
            });

            // Navigate back to subscription dashboard
            navigate(-1);

        } catch (err: any) {
            console.error('Error transferring subscription ownership:', err);
            setError(err?.message || t('subscription.transferError'));
        } finally {
            setLoading(false);
        }
    };

    if (loading && adminUsers.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const selectedUser = adminUsers.find(user => user.id === newOwnerId);

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white shadow sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                    <div className="sm:flex sm:items-start sm:justify-between">
                        <div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {t('subscription.transferOwnership')}
                            </h3>
                            <div className="mt-2 max-w-xl text-sm text-gray-500">
                                <p>{t('subscription.selectNewOwner')}</p>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
                            <button
                                onClick={() => navigate(-1)}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {t('ui.back')}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4">
                            <Message type="error">
                                {error}
                            </Message>
                        </div>
                    )}

                    {adminUsers.length === 0 ? (
                        <div className="mt-6 rounded-md bg-yellow-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800">
                                        {t('subscription.noAdminUsers')}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                            <div>
                                <div className="mt-1 relative">
                                    <select
                                        id="newOwnerId"
                                        value={newOwnerId}
                                        onChange={(e) => setNewOwnerId(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white"
                                        required
                                    >
                                        <option value="">{t('subscription.selectUser')}</option>
                                        {adminUsers.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.display_name || user.email}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                        <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {selectedUser && (
                                <div className="rounded-md bg-gray-50 p-4">
                                    <div className="flex">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {t('subscription.newOwnerDetails')}
                                            </h4>
                                            <div className="mt-2 text-sm text-gray-500">
                                                <p><strong>{t('subscription.users.nameHeader')}:</strong> {selectedUser.display_name || t('subscription.users.unnamed')}</p>
                                                <p><strong>{t('subscription.users.emailHeader')}:</strong> {selectedUser.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="rounded-md bg-yellow-50 p-4">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-yellow-800">
                                            {t('subscription.transferWarning')}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={!newOwnerId || loading}
                                    className="w-full sm:w-auto inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    {loading ? t('ui.loading') : t('subscription.confirmTransfer')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
