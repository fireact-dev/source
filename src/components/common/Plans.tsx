import { useTranslation } from 'react-i18next';
import { useConfig } from '../../contexts/ConfigContext';
import type { Plan } from '../../types';

interface PlansProps {
  onPlanSelect: (plan: Plan) => void;
  currentPlanId?: string;
}

interface ExtendedConfig {
  plans?: Plan[];
  [key: string]: any;
}

export default function Plans({ onPlanSelect, currentPlanId }: PlansProps) {
  const { t } = useTranslation();
  const config = useConfig() as unknown as ExtendedConfig;
  const activePlans = config.plans?.filter(plan => !plan.legacy) || [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {activePlans.map((plan) => (
        <div
          key={plan.id}
          className={`flex flex-col justify-between rounded-lg border ${
            plan.popular ? 'border-indigo-600' : 'border-gray-200'
          } p-6`}
        >
          <div>
            <div className="flex items-center gap-x-2">
              <h3 className="text-lg font-medium text-gray-900">
                {t(plan.titleKey)}
              </h3>
              {plan.popular && (
                <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
                  {t('plans.mostPopular')}
                </span>
              )}
            </div>
            <p className="mt-4 flex items-baseline gap-x-1">
              <span className="text-4xl font-semibold tracking-tight text-gray-900">
                {plan.currency}{plan.price}
              </span>
              <span className="text-sm font-semibold text-gray-600">
                /{t('plans.perWeek')}
              </span>
            </p>
            <ul role="list" className="mt-6 space-y-3 text-sm leading-6 text-gray-600">
              {plan.descriptionKeys.map((featureKey: string, index: number) => (
                <li key={index} className="flex gap-x-3">
                  <svg
                    className="h-6 w-5 flex-none text-indigo-600"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {t(featureKey)}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => onPlanSelect(plan)}
            disabled={plan.id === currentPlanId}
            className={`mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 
              ${
                plan.id === currentPlanId
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : plan.popular
                  ? 'bg-indigo-600 text-white hover:bg-indigo-500'
                  : 'text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300'
              }`}
          >
            {plan.id === currentPlanId ? t('subscription.currentPlan') : t('subscription.getStarted')}
          </button>
        </div>
      ))}
    </div>
  );
}
