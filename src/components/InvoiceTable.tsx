import { useTranslation } from 'react-i18next';
import type { Invoice } from '../types';

interface InvoiceTableProps {
    invoices: Invoice[];
}

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
    const { t } = useTranslation();

    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase()
        }).format(amount / 100);
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp * 1000);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'paid':
                return 'bg-green-100 text-green-800';
            case 'open':
                return 'bg-blue-100 text-blue-800';
            case 'uncollectible':
            case 'void':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleInvoiceClick = (hostedInvoiceUrl: string | null) => {
        if (hostedInvoiceUrl) {
            window.open(hostedInvoiceUrl, '_blank');
        }
    };

    return (
        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 hidden sm:table-header-group">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('subscription.invoices.numberHeader')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('subscription.invoices.dateHeader')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('subscription.invoices.amountHeader')}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('subscription.invoices.statusHeader')}
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                        <tr 
                            key={invoice.id}
                            onClick={() => handleInvoiceClick(invoice.hosted_invoice_url)}
                            className={`sm:table-row flex flex-col ${invoice.hosted_invoice_url ? "cursor-pointer hover:bg-gray-50" : ""}`}
                        >
                            <td className="px-6 py-4 sm:whitespace-nowrap">
                                <div className="block sm:hidden text-xs font-medium text-gray-500 uppercase mb-1">{t('subscription.invoices.numberHeader')}</div>
                                <div className="text-sm font-medium text-gray-900">
                                    {invoice.number || t('subscription.invoices.pending')}
                                </div>
                            </td>
                            <td className="px-6 py-4 sm:whitespace-nowrap">
                                <div className="block sm:hidden text-xs font-medium text-gray-500 uppercase mb-1">{t('subscription.invoices.dateHeader')}</div>
                                <div className="text-sm text-gray-900">
                                    {formatDate(invoice.created)}
                                </div>
                            </td>
                            <td className="px-6 py-4 sm:whitespace-nowrap">
                                <div className="block sm:hidden text-xs font-medium text-gray-500 uppercase mb-1">{t('subscription.invoices.amountHeader')}</div>
                                <div className="text-sm text-gray-900">
                                    {formatCurrency(invoice.total, invoice.currency)}
                                </div>
                            </td>
                            <td className="px-6 py-4 sm:whitespace-nowrap">
                                <div className="block sm:hidden text-xs font-medium text-gray-500 uppercase mb-1">{t('subscription.invoices.statusHeader')}</div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(invoice.status)}`}>
                                    {t(`subscription.invoices.status.${invoice.status}`)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
