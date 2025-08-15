import { createContext, useContext, type ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, type Functions, connectFunctionsEmulator } from 'firebase/functions';

import { type AppConfiguration, type FirebaseConfig, type SocialLoginConfig, type PagesConfig, type EmulatorsConfig, type StripeConfig } from '../types'; // Import AppConfiguration and StripeConfig

// Define the structure for the context value
interface ConfigContextType {
  firebase: FirebaseConfig;
  appConfig: AppConfiguration;
  auth: Auth;
  db: Firestore;
  functions: Functions;
  emulators?: EmulatorsConfig;
  pages: PagesConfig;
  socialLogin: SocialLoginConfig;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
  firebaseConfig: FirebaseConfig;
  appConfig: AppConfiguration;
  stripeConfig: StripeConfig;
}

export function ConfigProvider({ children, firebaseConfig, appConfig, stripeConfig }: ConfigProviderProps) {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  
  // Initialize Auth and connect to emulator if enabled
  const auth = getAuth(app);
  if (appConfig.emulators?.enabled) {
    try {
      const host = appConfig.emulators.host;
      const ports = appConfig.emulators.ports;
      connectAuthEmulator(auth, `http://${host}:${ports.auth}`, { disableWarnings: true });
    } catch (error) {
      console.error('Error connecting to Auth emulator:', error);
    }
  }

  // Initialize Firestore and connect to emulator if enabled
  const db = getFirestore(app);
  if (appConfig.emulators?.enabled) {
    try {
      const host = appConfig.emulators.host;
      const ports = appConfig.emulators.ports;
      connectFirestoreEmulator(db, host, ports.firestore);
    } catch (error) {
      console.error('Error connecting to Firestore emulator:', error);
    }
  }

  // Initialize Functions and connect to emulator if enabled
  const functions = getFunctions(app);
  if (appConfig.emulators?.enabled) {
    try {
      const host = appConfig.emulators.host;
      const ports = appConfig.emulators.ports;
      connectFunctionsEmulator(functions, host, ports.functions);
    } catch (error) {
      console.error('Error connecting to Functions emulator:', error);
    }
  }

  // Combine appConfig and stripeConfig into AppConfiguration
  const combinedConfig: AppConfiguration = {
    name: appConfig.name,
    socialLogin: appConfig.socialLogin,
    pages: appConfig.pages,
    permissions: appConfig.permissions,
    emulators: appConfig.emulators,
    settings: appConfig.settings,
    stripe: stripeConfig // Include stripe public_api_key and plans
  };

  const value: ConfigContextType = {
    firebase: firebaseConfig,
    appConfig: combinedConfig,
    auth,
    db,
    functions,
    emulators: appConfig.emulators,
    pages: appConfig.pages,
    socialLogin: appConfig.socialLogin
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}
