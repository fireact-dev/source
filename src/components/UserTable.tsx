import { useTranslation } from 'react-i18next';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { FirebaseError } from 'firebase/app';
import { useState } from 'react';
import Message from './Message';
import { useConfig } from '../contexts/ConfigContext';
import { type UserDetails } from '../types';
import EditPermissionsModal from './EditPermissionsModal';
import { useSubscription } from '../contexts/SubscriptionContext';

interface ExtendedConfig {
    permissions: Record<string, {
        label: string;
        default: boolean;
        admin: boolean;
    }>;
    [key: string]: any;
}

interface UserTableProps {
    users: UserDetails[];
    onRefresh: () => void;
    subscriptionId: string;
}

export default function UserTable({ users, onRefresh, subscriptionId }: UserTableProps) {
    const { t } = useTranslation();
    const { subscription } = useSubscription();
    const config = useConfig() as unknown as ExtendedConfig;
    const [isRevoking, setIsRevoking] = useState<string | null>(null);
    const [isRemoving, setIsRemoving] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editingUser, setEditingUser] = useState<UserDetails | null>(null);

    const handleRevoke = async (inviteId: string) => {
        setIsRevoking(inviteId);
        setError(null);

        try {
            const app = getApp();
            const functions = getFunctions(app);
            const revokeInvite = httpsCallable(functions, 'revokeInvite');

            await revokeInvite({
                inviteId,
                subscriptionId
            });

            // Refresh the user list
            onRefresh();
        } catch (error) {
            console.error('Error revoking invite:', error);
            if (error instanceof FirebaseError) {
                setError(t('subscription.invites.revokeError'));
            } else {
                setError(t('subscription.invites.revokeError'));
            }
        } finally {
            setIsRevoking(null);
        }
    };

    const handleRemove = async (userId: string) => {
        setIsRemoving(userId);
        setError(null);

        try {
            const app = getApp();
            const functions = getFunctions(app);
            const removeUser = httpsCallable(functions, 'removeUser');

            await removeUser({
                userId,
                subscriptionId
            });

            // Refresh the user list
            onRefresh();
        } catch (error) {
            console.error('Error removing user:', error);
            if (error instanceof FirebaseError) {
                setError(t('subscription.users.removeError'));
            } else {
                setError(t('subscription.users.removeError'));
            }
        } finally {
            setIsRemoving(null);
        }
    };

    const getPermissionLabels = (user: UserDetails, permissions: string[]) => {
        const labels = permissions.map(permission => {
            const permissionConfig = config.permissions[permission];
            return permissionConfig?.label || permission;
        });

        // Add "Owner" label only if this user is the subscription owner
        if (subscription?.owner_id === user.id) {
            labels.unshift('Owner');
        }

        return labels;
    };

    const isOwner = (user: UserDetails) => {
        return user.status === 'active' && subscription?.owner_id === user.id;
    };

    return (
        <div>
            {error && (
                <div className="mb-4">
                    <Message type="error">
                        {error}
                    </Message>
                </div>
            )}
            <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 hidden sm:table-header-group">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('subscription.users.nameHeader')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('subscription.users.emailHeader')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('subscription.users.permissionsHeader')}
                                        </th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            {t('subscription.users.statusHeader')}
                                        </th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map((user) => (
                                        <tr key={user.id} className="sm:table-row flex flex-col">
                                            <td className="px-6 py-4 sm:whitespace-nowrap">
                                                <div className="block sm:hidden text-xs font-medium text-gray-500 uppercase mb-1">{t('subscription.users.nameHeader')}</div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {user.display_name || t('subscription.users.unnamed')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 sm:whitespace-nowrap">
                                                <div className="block sm:hidden text-xs font-medium text-gray-500 uppercase mb-1">{t('subscription.users.emailHeader')}</div>
                                                <div className="text-sm text-gray-900">{user.email}</div>
                                            </td>
                                            <td className="px-6 py-4 sm:whitespace-nowrap">
                                                <div className="block sm:hidden text-xs font-medium text-gray-500 uppercase mb-1">{t('subscription.users.permissionsHeader')}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {getPermissionLabels(
                                                        user,
                                                        user.status === 'pending' ? 
                                                            user.pending_permissions || [] : 
                                                            user.permissions
                                                    ).map((label, index) => (
                                                        <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            label === 'Owner' ?
                                                                'bg-purple-100 text-purple-800' :
                                                                'bg-blue-100 text-blue-800'
                                                        }`}>
                                                            {label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 sm:whitespace-nowrap">
                                                <div className="block sm:hidden text-xs font-medium text-gray-500 uppercase mb-1">{t('subscription.users.statusHeader')}</div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    user.status === 'active' ? 
                                                        'bg-green-100 text-green-800' : 
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {t(`subscription.users.${user.status}`)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 sm:whitespace-nowrap text-right sm:text-right text-sm font-medium space-x-3">
                                                <div className="block sm:hidden text-xs font-medium text-gray-500 uppercase mb-1">Actions</div>
                                                {user.status === 'active' && !isOwner(user) && (
                                                    <>
                                                        <button
                                                            onClick={() => setEditingUser(user)}
                                                            className="inline-flex items-center px-3 py-1.5 border border-indigo-600 text-sm font-medium rounded text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                                        >
                                                            {t('subscription.users.edit')}
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemove(user.id)}
                                                            disabled={isRemoving === user.id}
                                                            className="inline-flex items-center px-3 py-1.5 border border-red-600 text-sm font-medium rounded text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                        >
                                                            {isRemoving === user.id ? 
                                                                t('subscription.users.removing') : 
                                                                t('subscription.users.remove')
                                                            }
                                                        </button>
                                                    </>
                                                )}
                                                {user.status === 'pending' && user.invite_id && (
                                                    <button
                                                        onClick={() => handleRevoke(user.invite_id!)}
                                                        disabled={isRevoking === user.invite_id}
                                                        className="inline-flex items-center px-3 py-1.5 border border-red-600 text-sm font-medium rounded text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-50 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                                                    >
                                                        {isRevoking === user.invite_id ? 
                                                            t('subscription.invites.revoking') : 
                                                            t('subscription.invites.revoke')
                                                        }
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {editingUser && (
                <EditPermissionsModal
                    user={editingUser}
                    subscriptionId={subscriptionId}
                    onClose={() => setEditingUser(null)}
                    onSuccess={onRefresh}
                />
            )}
        </div>
    );
}
