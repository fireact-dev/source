import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import InvoiceList from './InvoiceList';
import { type Plan } from '../types';

interface ExtendedConfig {
    plans?: Plan[];
    pages: Record<string, string>;
    [key: string]: any;
}

export default function Billing() {
    const { t } = useTranslation();
    const { subscription } = useSubscription();
    const config = useConfig() as ExtendedConfig;
    const { currentUser } = useAuth();

    // Get current plan details
    const currentPlan = config.plans?.find(p => p.id === subscription?.plan_id);
    const planName = currentPlan ? t(currentPlan.titleKey) : t('subscription.planNotFound');

    // Check if current user is the owner and subscription is not canceled
    const isOwner = subscription?.owner_id === currentUser?.uid;
    const isCanceled = subscription?.status === 'canceled';

    // Get the URLs from config and replace :id with subscription id
    const changePlanUrl = subscription?.id ? config.pages.changePlan.replace(':id', subscription.id) : '#';
    const cancelSubscriptionUrl = subscription?.id ? config.pages.cancelSubscription.replace(':id', subscription.id) : '#';
    const managePaymentMethodsUrl = subscription?.id ? config.pages.managePaymentMethods.replace(':id', subscription.id) : '#';
    const updateBillingDetailsUrl = subscription?.id ? config.pages.updateBillingDetails.replace(':id', subscription.id) : '#';
    const transferOwnershipUrl = subscription?.id ? config.pages.transferOwnership.replace(':id', subscription.id) : '#';

    // Determine button state and tooltip
    const isDisabled = !isOwner || isCanceled;
    const tooltipText = !isOwner 
        ? t('subscription.ownerOnly') 
        : isCanceled 
            ? t('subscription.alreadyCanceled') 
            : undefined;

    return (
        <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <div className="sm:flex sm:items-start sm:justify-between">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">{t('subscription.billing')}</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                {t('subscription.currentPlan')}: {planName}
                                {isCanceled && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        {t('subscription.canceled')}
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0 space-y-4 sm:space-y-0 sm:space-x-4">
                            <Link
                                to={!isDisabled ? updateBillingDetailsUrl : '#'}
                                className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                                    !isDisabled
                                        ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`}
                                onClick={e => isDisabled && e.preventDefault()}
                                title={tooltipText}
                            >
                                {t('subscription.updateBillingDetails')}
                            </Link>
                            <Link
                                to={!isDisabled ? managePaymentMethodsUrl : '#'}
                                className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                                    !isDisabled
                                        ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`}
                                onClick={e => isDisabled && e.preventDefault()}
                                title={tooltipText}
                            >
                                {t('subscription.managePaymentMethods')}
                            </Link>
                            <Link
                                to={!isDisabled ? changePlanUrl : '#'}
                                className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                                    !isDisabled
                                        ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`}
                                onClick={e => isDisabled && e.preventDefault()}
                                title={tooltipText}
                            >
                                {t('subscription.changePlan')}
                            </Link>
                            <Link
                                to={!isDisabled ? transferOwnershipUrl : '#'}
                                className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                                    !isDisabled
                                        ? 'bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500' 
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`}
                                onClick={e => isDisabled && e.preventDefault()}
                                title={tooltipText}
                            >
                                {t('subscription.transferOwnership')}
                            </Link>
                            <Link
                                to={!isDisabled ? cancelSubscriptionUrl : '#'}
                                className={`w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                                    !isDisabled
                                        ? 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500' 
                                        : 'bg-gray-400 cursor-not-allowed'
                                }`}
                                onClick={e => isDisabled && e.preventDefault()}
                                title={tooltipText}
                            >
                                {t('subscription.cancelSubscription')}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            {subscription && <InvoiceList />}
        </div>
    );
}
