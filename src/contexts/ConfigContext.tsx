import { createContext, useContext, type ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, type Functions, connectFunctionsEmulator } from 'firebase/functions';

import firebaseConfig from '../config/firebase.config.json';
import appConfig from '../config/app.config.json';

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface SocialLoginConfig {
  google: boolean;
  microsoft: boolean;
  facebook: boolean;
  apple: boolean;
  github: boolean;
  twitter: boolean;
  yahoo: boolean;
}

interface PagesConfig extends Record<string, string> {}

interface EmulatorsConfig {
  enabled: boolean;
  host: string;
  ports: {
    functions: number;
    firestore: number;
    auth: number;
    hosting: number;
  };
}

interface PermissionsConfig {
  access: {
    label: string;
    default: boolean;
    admin: boolean;
  };
  editor: {
    label: string;
    default: boolean;
    admin: boolean;
  };
  admin: {
    label: string;
    default: boolean;
    admin: boolean;
  };
}

interface AppConfig {
  name: string;
  socialLogin: SocialLoginConfig;
  pages: PagesConfig;
  permissions: PermissionsConfig;
  emulators?: EmulatorsConfig;
}

interface ConfigContextType {
  firebase: FirebaseConfig;
  socialLogin: SocialLoginConfig;
  pages: PagesConfig;
  permissions: PermissionsConfig;
  auth: Auth;
  db: Firestore;
  functions: Functions;
  name: string;
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

  const value: ConfigContextType = {
    firebase: firebaseConfig.firebase,
    socialLogin: appConfig.socialLogin,
    pages: appConfig.pages,
    permissions: appConfig.permissions,
    auth,
    db,
    functions,
    name: appConfig.name,
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
