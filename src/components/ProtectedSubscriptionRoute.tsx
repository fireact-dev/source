import { Navigate } from 'react-router-dom';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { useConfig } from '../contexts/ConfigContext';
import type { ReactNode } from 'react';

interface ExtendedConfig {
    permissions: Record<string, {
        label: string;
        default: boolean;
        admin: boolean;
    }>;
    pages: {
        home: string;
        signin: string;
    };
    [key: string]: any;
}

interface ProtectedSubscriptionRouteProps {
  children: ReactNode;
  requiredPermissions?: string[];
  requireAll?: boolean;
}

export default function ProtectedSubscriptionRoute({ 
  children, 
  requiredPermissions = [], 
  requireAll = false 
}: ProtectedSubscriptionRouteProps) {
  const { loading, hasPermission, subscription } = useSubscription();
  const config = useConfig() as unknown as ExtendedConfig;
  const { currentUser } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to={config.pages.signin} state={{ from: location }} replace />;
  }

  // If no permissions required, allow access
  if (requiredPermissions.length === 0) {
    return <>{children}</>;
  }

  // Special handling for owner permission
  if (requiredPermissions.includes('owner')) {
    if (subscription?.owner_id !== currentUser.uid) {
      return <Navigate to={config.pages.home} replace />;
    }
    return <>{children}</>;
  }

  // Check if all required permissions are valid
  const validPermissions = Object.keys(config.permissions);
  const hasInvalidPermission = requiredPermissions.some(
    permission => permission !== 'owner' && !validPermissions.includes(permission)
  );

  if (hasInvalidPermission) {
    console.error('Invalid permission requested');
    return <Navigate to={config.pages.home} replace />;
  }

  // Check permissions based on requireAll flag
  const hasAccess = requireAll
    ? requiredPermissions.every(permission => permission === 'owner' || hasPermission(permission))
    : requiredPermissions.some(permission => permission === 'owner' || hasPermission(permission));

  if (!hasAccess) {
    return <Navigate to={config.pages.home} replace />;
  }

  return <>{children}</>;
}
