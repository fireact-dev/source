import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { useConfig } from './ConfigContext';
import type { Subscription } from '../types';

interface ExtendedConfig {
    permissions: Record<string, {
        label: string;
        default: boolean;
        admin: boolean;
    }>;
    [key: string]: any;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  /**
   * Array of permission levels the current user has in this subscription
   * e.g. ['access', 'editor', 'admin']
   */
  userPermissions: string[];
  /**
   * Check if the user has a specific permission level
   * @param permission - The permission level to check
   * @returns true if user has the permission, false otherwise
   */
  hasPermission: (permission: string) => boolean;
  /**
   * Update subscription data in context
   * @param data - Partial subscription data to update
   */
  updateSubscription: (data: Partial<Subscription>) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  loading: true,
  error: null,
  userPermissions: [],
  hasPermission: () => false,
  updateSubscription: () => {},
});

export function useSubscription() {
  return useContext(SubscriptionContext);
}

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const { id } = useParams();
  const config = useConfig() as unknown as ExtendedConfig;
  const { db } = useConfig();
  const { currentUser } = useAuth();

  // Find the permission key that has default: true
  const defaultPermission = Object.entries(config.permissions).find(
    ([_, value]) => value.default
  )?.[0] || 'access';

  // Helper function to extract user permissions from subscription
  const extractUserPermissions = (subscriptionData: Subscription, userId: string): string[] => {
    const permissions: string[] = [];
    Object.entries(subscriptionData.permissions).forEach(([permission, users]) => {
      if (users?.includes(userId)) {
        permissions.push(permission);
      }
    });
    return permissions;
  };

  // Check if user has a specific permission level
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission);
  };

  // Update subscription data in context
  const updateSubscription = (data: Partial<Subscription>) => {
    if (subscription) {
      const updatedSubscription = {
        ...subscription,
        ...data
      };
      setSubscription(updatedSubscription);
    }
  };

  useEffect(() => {
    async function fetchSubscription() {
      if (!id) {
        setError('No subscription ID provided');
        setLoading(false);
        return;
      }

      if (!currentUser?.uid) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      try {
        const subscriptionDoc = await getDoc(doc(db, 'subscriptions', id));
        
        if (!subscriptionDoc.exists()) {
          setError('Subscription not found');
          setSubscription(null);
          setUserPermissions([]);
        } else {
          const data = subscriptionDoc.data();
          // Check if user has at least the default permission
          if (data.permissions[defaultPermission]?.includes(currentUser.uid)) {
            setSubscription({
              ...data,
              id: subscriptionDoc.id
            } as Subscription);
            // Extract all permissions for the user
            const permissions = extractUserPermissions({ ...data, id: subscriptionDoc.id } as Subscription, currentUser.uid);
            setUserPermissions(permissions);
            setError(null);
          } else {
            setError('Access denied');
            setSubscription(null);
            setUserPermissions([]);
          }
        }
      } catch (err) {
        setError('Error fetching subscription data');
        setSubscription(null);
        setUserPermissions([]);
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    fetchSubscription();
  }, [db, id, currentUser?.uid, config, defaultPermission]);

  const contextValue: SubscriptionContextType = {
    subscription,
    loading,
    error,
    userPermissions,
    hasPermission,
    updateSubscription,
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}
