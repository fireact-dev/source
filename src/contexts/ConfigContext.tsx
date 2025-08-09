import { createContext, useContext, type ReactNode } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, type Functions, connectFunctionsEmulator } from 'firebase/functions';

interface ConfigContextType {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
  socialLogin: {
    google: boolean;
    microsoft: boolean;
    facebook: boolean;
    apple: boolean;
    github: boolean;
    twitter: boolean;
    yahoo: boolean;
  };
  pages: Record<string, string>;
  auth: Auth;
  db: Firestore;
  functions: Functions;
  name: string;
  emulators?: {
    enabled: boolean;
    host: string;
    ports: {
      functions: number;
      firestore: number;
      auth: number;
      hosting: number;
    };
  };
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  config: {
    firebase: ConfigContextType['firebase'];
    socialLogin: ConfigContextType['socialLogin'];
    pages: ConfigContextType['pages'];
    name: string;
    emulators?: ConfigContextType['emulators'];
  };
  children: ReactNode;
}

export function ConfigProvider({ config, children }: ConfigProviderProps) {
  // Initialize Firebase
  const app = initializeApp(config.firebase);
  
  // Initialize Auth and connect to emulator if enabled
  const auth = getAuth(app);
  if (config.emulators?.enabled) {
    try {
      const host = config.emulators.host;
      const ports = config.emulators.ports;
      connectAuthEmulator(auth, `http://${host}:${ports.auth}`, { disableWarnings: true });
    } catch (error) {
      console.error('Error connecting to Auth emulator:', error);
    }
  }

  // Initialize Firestore and connect to emulator if enabled
  const db = getFirestore(app);
  if (config.emulators?.enabled) {
    try {
      const host = config.emulators.host;
      const ports = config.emulators.ports;
      connectFirestoreEmulator(db, host, ports.firestore);
    } catch (error) {
      console.error('Error connecting to Firestore emulator:', error);
    }
  }

  // Initialize Functions and connect to emulator if enabled
  const functions = getFunctions(app);
  if (config.emulators?.enabled) {
    try {
      const host = config.emulators.host;
      const ports = config.emulators.ports;
      connectFunctionsEmulator(functions, host, ports.functions);
    } catch (error) {
      console.error('Error connecting to Functions emulator:', error);
    }
  }

  const value: ConfigContextType = {
    ...config,
    auth,
    db,
    functions,
    name: config.name
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
