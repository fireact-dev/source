import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import Message from './Message';
import { useConfig } from '../contexts/ConfigContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { Link } from 'react-router-dom';
import UserTable from './UserTable';
import Pagination from './Pagination';
import { type UserDetails } from '../types';

interface ExtendedConfig {
    pages: {
        invite: string;
    };
    [key: string]: any;
}

export default function UserList() {
    const [users, setUsers] = useState<UserDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const { t } = useTranslation();
    const { subscription } = useSubscription();
    const config = useConfig() as unknown as ExtendedConfig;

    const loadUsers = async () => {
        if (!subscription?.id) return;

        setLoading(true);
        setError(null);

        try {
            const app = getApp();
            const functions = getFunctions(app);
            const getSubscriptionUsers = httpsCallable(functions, 'getSubscriptionUsers');
            
            const result = await getSubscriptionUsers({
                subscriptionId: subscription.id,
                page,
                pageSize: itemsPerPage
            });

            const data = result.data as { users: UserDetails[], total: number };
            setUsers(data.users);
            setTotal(data.total);
        } catch (err) {
            console.error('Error loading users:', err);
            setError(t('subscription.users.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, [subscription?.id, page, itemsPerPage]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <div className="sm:flex sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">{t('subscription.users.title')}</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('subscription.users.description')}
                            </p>
                        </div>
                        <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
                            <Link
                                to={config.pages.invite.replace(':id', subscription?.id || '')}
                                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                {t('subscription.invite.menuItem')}
                            </Link>
                        </div>
                    </div>
                    {error && (
                        <div className="mt-4">
                            <Message type="error">
                                {error}
                            </Message>
                        </div>
                    )}
                </div>
                <div className="border-t border-gray-200">
                    <div className="px-4 py-5 sm:p-6">
                        <UserTable 
                            users={users} 
                            onRefresh={loadUsers}
                            subscriptionId={subscription?.id || ''}
                        />
                    </div>
                </div>
                <Pagination
                    currentPage={page}
                    totalItems={total}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setPage}
                    onItemsPerPageChange={setItemsPerPage}
                />
            </div>
        </div>
    );
}
