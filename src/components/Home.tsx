import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfig } from '../contexts/ConfigContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getApp } from 'firebase/app';
import { type Subscription, type Invite } from '../types';

interface ExtendedConfig {
    permissions: Record<string, {
        label: string;
        default: boolean;
        admin: boolean;
    }>;
    pages: {
        subscription: string;
        createPlan: string;
    };
    [key: string]: any;
}

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const config = useConfig() as unknown as ExtendedConfig;
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const type = t('subscription.singular').charAt(0).toUpperCase() + t('subscription.singular').slice(1);
  const plural = t('subscription.plural').charAt(0).toUpperCase() + t('subscription.plural').slice(1);

  // Find the permission key that has default: true
  const defaultPermission = Object.entries(config.permissions).find(
    ([_, value]) => value.default
  )?.[0] || 'access';

  const loadData = async () => {
    if (!currentUser?.uid) return;

    setLoading(true);
    try {
      const db = getFirestore();
      
      // Load subscriptions
      const subsQuery = query(
        collection(db, 'subscriptions'),
        where(`permissions.${defaultPermission}`, 'array-contains', currentUser.uid)
      );
      
      const subsSnapshot = await getDocs(subsQuery);
      const subs = subsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Subscription));
      
      setSubscriptions(subs);

      // Load invites
      if (currentUser.email) {
        const invitesQuery = query(
          collection(db, 'invites'),
          where('email', '==', currentUser.email.toLowerCase()),
          where('status', '==', 'pending')
        );
        
        const invitesSnapshot = await getDocs(invitesQuery);
        const pendingInvites = invitesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Invite));
        
        setInvites(pendingInvites);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.uid, currentUser?.email]);

  const handleAcceptInvite = async (invite: Invite) => {
    setIsAccepting(true);
    setError(null);
    try {
      const app = getApp();
      const functions = getFunctions(app);
      const acceptInviteFunction = httpsCallable(functions, 'acceptInvite');
      
      await acceptInviteFunction({ inviteId: invite.id });
      
      // Reload data after accepting invite
      await loadData();
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError(t('subscription.invites.acceptError'));
    } finally {
      setIsAccepting(false);
    }
  };

  const handleRejectInvite = async (invite: Invite) => {
    setIsRejecting(true);
    setError(null);
    try {
      const app = getApp();
      const functions = getFunctions(app);
      const rejectInviteFunction = httpsCallable(functions, 'rejectInvite');
      
      await rejectInviteFunction({ inviteId: invite.id });
      
      // Reload data after rejecting invite
      await loadData();
    } catch (err) {
      console.error('Error rejecting invite:', err);
      setError(t('subscription.invites.rejectError'));
    } finally {
      setIsRejecting(false);
    }
  };

  const formatPermissions = (permissions: string[]) => {
    return permissions.map(p => config.permissions[p]?.label).join(', ');
  };

  return (
    <div className="space-y-6">
      {invites.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <h2 className="text-xl font-semibold p-6">{t('subscription.invites.title')}</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {invites.map((invite) => (
                <div 
                  key={invite.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium text-lg text-gray-900">
                      {invite.subscription_name || t('subscription.untitled')}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {t('subscription.invites.invitedBy', {
                        name: invite.host_name,
                        permissions: formatPermissions(invite.permissions)
                      })}
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleRejectInvite(invite)}
                      disabled={isRejecting || isAccepting}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      {isRejecting ? t('subscription.invites.rejecting') : t('subscription.invites.reject')}
                    </button>
                    <button
                      onClick={() => handleAcceptInvite(invite)}
                      disabled={isAccepting || isRejecting}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed"
                    >
                      {isAccepting ? t('subscription.invites.accepting') : t('subscription.invites.accept')}
                    </button>
                  </div>
                </div>
              ))}
              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-6">
            <h2 className="text-xl font-semibold">{t('subscription.your', { type: plural })}</h2>
            <button
              onClick={() => navigate(config.pages.createPlan)}
              className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {t('subscription.create', { type })}
            </button>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : subscriptions.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {subscriptions.map((subscription) => (
                <Link 
                  key={subscription.id} 
                  to={config.pages.subscription.replace(':id', subscription.id)}
                  className="block p-6 border rounded-lg hover:border-indigo-600 hover:shadow-md transition-all group"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="font-medium text-lg text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {subscription.settings?.name || t('subscription.untitled')}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        subscription.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {subscription.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      {t(`plans.${subscription.plan_id}.title`)}
                    </div>
                    <div className="text-sm text-gray-400 font-mono mt-auto">
                      {subscription.id}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('subscription.your', { type: plural })}</h3>
              <button
                onClick={() => navigate(config.pages.createPlan)}
                className="mt-1 text-sm text-indigo-600 hover:text-indigo-500"
              >
                {t('subscription.create', { type })}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
