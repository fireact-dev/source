import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '../contexts/SubscriptionContext';
import { doc, updateDoc } from 'firebase/firestore';
import Message from './common/Message';
import { useConfig } from '../contexts/ConfigContext';
import { useNavigate } from 'react-router-dom';
import type { SubscriptionSettings as Settings } from '../types';


export default function SubscriptionSettings() {
  const { t } = useTranslation();
  const { subscription, updateSubscription } = useSubscription();
  const config = useConfig();
  const { db } = useConfig();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>({
    name: subscription?.settings?.name || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const getSubscriptionPath = () => {
    return config.appConfig.pages.subscription.replace(':id', subscription?.id || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subscription?.id) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const subscriptionRef = doc(db, 'subscriptions', subscription.id);
      const updatedSettings = {
        settings: {
          ...subscription.settings,
          ...settings
        }
      };
      await updateDoc(subscriptionRef, updatedSettings);
      // Update the context
      updateSubscription(updatedSettings);
      setMessage({ type: 'success', text: t('success.saved') });
      setTimeout(() => {
        navigate(getSubscriptionPath());
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: t('error.updateFailed') });
      setIsSubmitting(false);
    }
  };

  if (!subscription) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <div className="sm:flex sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">{t('subscription.settings')}</h2>
            </div>
            <div className="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0">
              <button
                onClick={() => navigate(getSubscriptionPath())}
                className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                {t('back')}
              </button>
            </div>
          </div>
          {message && (
            <div className="mt-4">
              <Message type={message.type}>
                {message.text}
              </Message>
            </div>
          )}
        </div>
        <div className="border-t border-gray-200">
          <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {Object.entries(config.appConfig.settings || {}).map(([key, setting]) => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-700 mb-1">
                    {t(setting.label)}
                  </label>
                  <input
                    type={setting.type}
                    name={key}
                    id={key}
                    value={settings[key as keyof Settings] || ''}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      [key]: e.target.value
                    }))}
                    className="block w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder={t(setting.placeholder)}
                    required={setting.required}
                    disabled={isSubmitting}
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed inline-flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('save')}
                  </>
                ) : (
                  t('save')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
