import { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, getDocs, startAfter } from 'firebase/firestore';
import type { Invoice } from '../types';

interface UseSubscriptionInvoicesProps {
    subscriptionId: string;
    pageSize?: number;
}

interface UseSubscriptionInvoicesResult {
    invoices: Invoice[];
    loading: boolean;
    error: Error | null;
    hasMore: boolean;
    loadMore: () => Promise<void>;
}

export function useSubscriptionInvoices({ subscriptionId, pageSize = 10 }: UseSubscriptionInvoicesProps): UseSubscriptionInvoicesResult {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [lastDoc, setLastDoc] = useState<any>(null);

    useEffect(() => {
        loadInitialInvoices();
    }, [subscriptionId]);

    const loadInitialInvoices = async () => {
        setLoading(true);
        setError(null);
        try {
            const db = getFirestore();
            const invoicesRef = collection(db, 'subscriptions', subscriptionId, 'invoices');
            const q = query(
                invoicesRef,
                orderBy('created', 'desc'),
                limit(pageSize)
            );

            const snapshot = await getDocs(q);
            const docs = snapshot.docs;
            
            setInvoices(docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Invoice)));

            setLastDoc(docs[docs.length - 1] || null);
            setHasMore(docs.length === pageSize);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    const loadMore = async () => {
        if (!hasMore || loading || !lastDoc) return;

        setLoading(true);
        setError(null);
        try {
            const db = getFirestore();
            const invoicesRef = collection(db, 'subscriptions', subscriptionId, 'invoices');
            const q = query(
                invoicesRef,
                orderBy('created', 'desc'),
                startAfter(lastDoc),
                limit(pageSize)
            );

            const snapshot = await getDocs(q);
            const docs = snapshot.docs;
            
            setInvoices(prev => [
                ...prev,
                ...docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as Invoice))
            ]);

            setLastDoc(docs[docs.length - 1] || null);
            setHasMore(docs.length === pageSize);
        } catch (err) {
            setError(err as Error);
        } finally {
            setLoading(false);
        }
    };

    return {
        invoices,
        loading,
        error,
        hasMore,
        loadMore
    };
}
