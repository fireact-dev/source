import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import Message from './common/Message';
import { useConfig } from '../contexts/ConfigContext';
import Plans from './common/Plans';
import BillingForm from './common/BillingForm';
import { type Plan } from '../types';
import { useSubscription } from '../contexts/SubscriptionContext';

interface ExtendedConfig {
    plans?: Plan[];
    [key: string]: any;
}

export default function ChangePlan() {
    const [step, setStep] = useState<1 | 2>(1);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const config = useConfig() as unknown as ExtendedConfig;
    const { subscription, updateSubscription } = useSubscription();
    const { functions } = useConfig();

    const handlePlanSelect = async (plan: Plan) => {
        setSelectedPlan(plan);
        
        // Get current plan
        const currentPlan = config.plans?.find(p => p.id === subscription?.plan_id);
        if (!currentPlan) {
            setError(t('subscription.planNotFound'));
            return;
        }

        // If selected plan is paid and current plan is free, show billing form
        if (currentPlan.free && plan.price > 0) {
            setStep(2);
            return;
        }

        // Otherwise, use existing payment method
        try {
            setLoading(true);
            setError(null);

            const changeSubscriptionPlan = httpsCallable(functions, 'changeSubscriptionPlan');
            await changeSubscriptionPlan({
                subscriptionId: subscription?.id,
                planId: plan.id
            });

            // Update subscription context with new plan
            if (subscription) {
                updateSubscription({
                    ...subscription,
                    plan_id: plan.id
                });
            }

            // Navigate back to billing page
            navigate(-1);

        } catch (err) {
            console.error('Error changing plan:', err);
            setError(t('subscription.changePlanError'));
        } finally {
            setLoading(false);
        }
    };

    const handleBillingSubmit = async (paymentMethodId: string, billingDetails: any) => {
        if (!selectedPlan || !subscription) return;

        try {
            setLoading(true);
            setError(null);

            const changeSubscriptionPlan = httpsCallable(functions, 'changeSubscriptionPlan');
            await changeSubscriptionPlan({
                subscriptionId: subscription.id,
                planId: selectedPlan.id,
                billingInfo: {
                    billingDetails,
                    paymentMethodId
                }
            });

            // Update subscription context with new plan
            updateSubscription({
                ...subscription,
                plan_id: selectedPlan.id
            });

            // Navigate back to billing page
            navigate(-1);

        } catch (err) {
            console.error('Error changing plan:', err);
            setError(t('subscription.changePlanError'));
            throw err; // Re-throw to let BillingForm handle the error display
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
                            <h2 className="text-xl font-semibold">
                                {step === 1 ? t('subscription.changePlan') : t('subscription.billing')}
                            </h2>
                        </div>
                        {step === 1 && (
                            <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
                                <button
                                    onClick={() => navigate(-1)}
                                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        )}
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

                {step === 1 && (
                    <Plans 
                        onPlanSelect={handlePlanSelect}
                        currentPlanId={subscription?.plan_id}
                    />
                )}

                {step === 2 && selectedPlan && selectedPlan.price > 0 && (
                    <BillingForm 
                        plan={selectedPlan}
                        onSubmit={handleBillingSubmit}
                    />
                )}
            </div>
        </div>
    );
}
