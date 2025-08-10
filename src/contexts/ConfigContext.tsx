import { createContext, useContext, type ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, type Functions, connectFunctionsEmulator } from 'firebase/functions';

import firebaseConfig from '../config/firebase.config.json';
import appConfig from '../config/app.config.json';
import stripeConfig from '../config/stripe.config.json'; // Import stripe config
import { type AppConfiguration, type StripeConfig, type FirebaseConfig, type SocialLoginConfig, type PagesConfig, type EmulatorsConfig, type PermissionsConfig } from '../types'; // Import AppConfiguration and StripeConfig

// Define the structure for the context value
interface ConfigContextType {
  firebase: FirebaseConfig; // Keep FirebaseConfig as it's from firebaseConfig.json
  appConfig: AppConfiguration; // Use the consolidated AppConfiguration
  auth: Auth;
  db: Firestore;
  functions: Functions;
  emulators?: EmulatorsConfig;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export function ConfigProvider({ children }: ConfigProviderProps) {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig.firebase);
  
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
    stripe: stripeConfig.stripe // Include stripe public_api_key and plans
  };

  const value: ConfigContextType = {
    firebase: firebaseConfig.firebase,
    appConfig: combinedConfig,
    auth,
    db,
    functions,
    emulators: appConfig.emulators
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
