import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { useConfig } from '../contexts/ConfigContext';
import Plans from './common/Plans';
import BillingForm from './common/BillingForm';
import type { Plan } from '../types';


interface SubscriptionResponse {
  subscriptionId: string;
  clientSecret: string | null;
  customerId: string;
}

export default function CreatePlan() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const config = useConfig();

  const handlePlanSelect = async (plan: Plan) => {
    setSelectedPlan(plan);
    setError(null);
    
    if (plan.free) {
      // Create free subscription without billing info
      try {
        setLoading(true);
        const createSubscriptionCall = httpsCallable<any, SubscriptionResponse>(config.functions, 'createSubscription');
        const { data: subscriptionData } = await createSubscriptionCall({
          planId: plan.id
        });
        navigate(config.appConfig.pages.settings.replace(':id', subscriptionData.subscriptionId));
      } catch (err) {
        console.error('Error creating subscription:', err);
        setError(t('subscription.createError'));
      } finally {
        setLoading(false);
      }
    } else {
      // Show billing form for paid plans
      setStep(2);
    }
  };

  const handleBillingSubmit = async (paymentMethodId: string, billingDetails: any) => {
    if (!selectedPlan) return;

    try {
      setLoading(true);
      setError(null);

      const createSubscriptionCall = httpsCallable<any, SubscriptionResponse>(config.functions, 'createSubscription');
      const { data: subscriptionData } = await createSubscriptionCall({
        planId: selectedPlan.id,
        billingInfo: {
          billingDetails,
          paymentMethodId
        }
      });

      if (subscriptionData.clientSecret) {
        // Handle payment confirmation if needed
        // This would be implemented based on your payment flow
        console.log('Payment confirmation needed');
      } else {
        navigate(config.appConfig.pages.settings.replace(':id', subscriptionData.subscriptionId));
      }
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(t('subscription.createError'));
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
        <h2 className="text-xl font-semibold p-6">
          {step === 1 ? t('plans.title') : t('subscription.billing')}
        </h2>
      </div>
      <div className="p-6">
        {error && (
          <div className="mb-4 text-red-600">
            {error}
          </div>
        )}

        {step === 1 && (
          <Plans onPlanSelect={handlePlanSelect} />
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
