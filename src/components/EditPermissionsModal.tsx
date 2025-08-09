import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { FirebaseError } from 'firebase/app';
import Message from './common/Message';
import { useConfig } from '../contexts/ConfigContext';
import type { UserDetails } from '../types';

interface ExtendedConfig {
    permissions: Record<string, {
        label: string;
        default: boolean;
        admin: boolean;
    }>;
    [key: string]: any;
}

interface EditPermissionsModalProps {
    user: UserDetails;
    subscriptionId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function EditPermissionsModal({ user, subscriptionId, onClose, onSuccess }: EditPermissionsModalProps) {
    const { t } = useTranslation();
    const config = useConfig() as unknown as ExtendedConfig;

    // Get permission key that has default: true
    const defaultPermission = Object.entries(config.permissions)
        .find(([_, value]) => value.default)?.[0] || '';

    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(user.permissions);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleUpdatePermissions = async () => {
        setIsUpdating(true);
        setError(null);

        try {
            const app = getApp();
            const functions = getFunctions(app);
            const updatePermissions = httpsCallable(functions, 'updateUserPermissions');

            // Always include default permission
            if (defaultPermission && !selectedPermissions.includes(defaultPermission)) {
                selectedPermissions.push(defaultPermission);
            }

            await updatePermissions({
                userId: user.id,
                subscriptionId,
                permissions: selectedPermissions
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating permissions:', error);
            if (error instanceof FirebaseError) {
                setError(t('subscription.users.updatePermissionsError'));
            } else {
                setError(t('subscription.users.updatePermissionsError'));
            }
        } finally {
            setIsUpdating(false);
        }
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">
                        {t('subscription.users.editPermissions')}
                    </h3>
                </div>

                {error && (
                    <div className="px-6 py-4">
                        <Message type="error">
                            {error}
                        </Message>
                    </div>
                )}

                <div className="px-6 py-4">
                    <div className="space-y-4">
                        {Object.entries(config.permissions).map(([key, value]) => (
                            <label key={key} className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={selectedPermissions.includes(key)}
                                    onChange={() => togglePermission(key)}
                                    disabled={key === defaultPermission || isUpdating}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded disabled:opacity-50"
                                />
                                <span className="text-sm text-gray-900">{value.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 rounded-b-lg">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isUpdating}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={handleUpdatePermissions}
                        disabled={isUpdating}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isUpdating ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('saving')}
                            </>
                        ) : (
                            t('save')
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
