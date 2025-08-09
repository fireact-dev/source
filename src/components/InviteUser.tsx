import { useState } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useTranslation } from 'react-i18next';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { FirebaseError } from 'firebase/app';
import { getApp } from 'firebase/app';
import Message from './Message';
import { useConfig } from '../contexts/ConfigContext';
import { useNavigate } from 'react-router-dom';

interface ExtendedConfig {
    permissions: Record<string, {
        label: string;
        default: boolean;
        admin: boolean;
    }>;
    pages: {
        users: string;
    };
    [key: string]: any;
}

export default function InviteUser() {
    const config = useConfig() as unknown as ExtendedConfig;

    // Find the permission with default=true
    const defaultPermission = Object.entries(config.permissions)
        .find(([_, value]) => value.default)?.[0] || '';

    const [email, setEmail] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([defaultPermission]);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { subscription } = useSubscription();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subscription?.id) return;

        setIsSubmitting(true);
        setMessage(null);

        try {
            const app = getApp();
            const functions = getFunctions(app);
            const createInvite = httpsCallable(functions, 'createInvite');
            
            await createInvite({
                email,
                subscriptionId: subscription.id,
                permissions: selectedPermissions
            });

            setMessage({ type: 'success', text: t('subscription.invite.success') });
            setEmail('');
            
            // Navigate back to users list after successful invite
            setTimeout(() => {
                navigate(config.pages.users.replace(':id', subscription.id));
            }, 1500);
        } catch (error) {
            console.error('Error creating invite:', error);
            if (error instanceof FirebaseError) {
                // Check for specific error codes
                if (error.code === 'functions/already-exists') {
                    if (error.message.includes('pending invite')) {
                        setMessage({ type: 'error', text: t('subscription.invites.alreadyInvited') });
                    } else if (error.message.includes('already a member')) {
                        setMessage({ type: 'error', text: t('subscription.invites.alreadyMember') });
                    } else {
                        setMessage({ type: 'error', text: t('subscription.invite.error') });
                    }
                } else {
                    setMessage({ type: 'error', text: t('subscription.invite.error') });
                }
            } else {
                setMessage({ type: 'error', text: t('subscription.invite.error') });
            }
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        navigate(config.pages.users.replace(':id', subscription?.id || ''));
    };

    const togglePermission = (permission: string) => {
        setSelectedPermissions(prev => {
            if (prev.includes(permission)) {
                // Don't allow removing the default permission
                if (permission === defaultPermission) return prev;
                return prev.filter(p => p !== permission);
            } else {
                return [...prev, permission];
            }
        });
    };

    return (
        <div className="max-w-7xl mx-auto">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6">
                    <h2 className="text-lg font-medium text-gray-900">{t('subscription.invite.title')}</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {t('subscription.invite.description')}
                    </p>
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
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    {t('subscription.invite.email')}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="block w-full px-4 py-3 text-gray-900 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('subscription.users.permissionsHeader')}
                                </label>
                                <div className="space-y-2">
                                    {Object.entries(config.permissions).map(([key, value]) => (
                                        <label key={key} className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedPermissions.includes(key)}
                                                onChange={() => togglePermission(key)}
                                                disabled={key === defaultPermission || isSubmitting}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                                            />
                                            <span className="text-sm text-gray-900">{value.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleBack}
                                disabled={isSubmitting}
                                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                                {t('subscription.users.backToList')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed inline-flex items-center"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('subscription.invite.sending')}
                                    </>
                                ) : (
                                    t('subscription.invite.send')
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
