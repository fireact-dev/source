import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Message from './common/Message';
import { useSubscription } from '../contexts/SubscriptionContext';
import InvoiceTable from './InvoiceTable';
import Pagination from './common/Pagination';
import { getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { Invoice } from '../types';

export default function InvoiceList() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [total, setTotal] = useState(0);
    const { t } = useTranslation();
    const { subscription } = useSubscription();

    const loadInvoices = async () => {
        if (!subscription?.id) return;

        setLoading(true);
        setError(null);

        try {
            const db = getFirestore();
            const invoicesRef = collection(db, 'subscriptions', subscription.id, 'invoices');
            
            // Get total count
            const totalQuery = query(invoicesRef);
            const snapshot = await getDocs(totalQuery);
            setTotal(snapshot.size);

            // Get paginated invoices
            const q = query(
                invoicesRef,
                orderBy('created', 'desc'),
                limit(itemsPerPage)
            );

            const invoicesSnapshot = await getDocs(q);
            setInvoices(invoicesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Invoice)));

        } catch (err) {
            console.error('Error loading invoices:', err);
            setError(t('subscription.invoices.loadError'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInvoices();
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
                            <h2 className="text-lg font-medium text-gray-900">{t('subscription.invoices.title')}</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('subscription.invoices.description')}
                            </p>
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
                        <InvoiceTable 
                            invoices={invoices}
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
