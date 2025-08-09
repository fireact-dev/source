import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useConfig } from '../../contexts/ConfigContext';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { pages } = useConfig();

  return currentUser ? <>{children}</> : <Navigate to={pages.signIn} />;
};

export default PrivateRoute;
