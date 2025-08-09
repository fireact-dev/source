import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { ConfigProvider } from './contexts/ConfigContext';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import EditName from './components/EditName';
import EditEmail from './components/EditEmail';
import ResetPassword from './components/ResetPassword';
import FirebaseAuthActions from './components/FirebaseAuthActions';
import ChangePassword from './components/ChangePassword';
import DeleteAccount from './components/DeleteAccount';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';
import PublicLayout from './layouts/PublicLayout';
import DesktopMenuItems from './components/DesktopMenuItems';
import MobileMenuItems from './components/MobileMenuItems';
import Logo from './components/Logo';
import appConfig from './config/app.config.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './i18n/en';
import zh from './i18n/zh';

// Initialize i18next
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en
      },
      zh: {
        translation: zh
      }
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

function App() {
  return (
    <Router>
      <ConfigProvider>
        <AuthProvider>
          <LoadingProvider>
            <Routes>
              <Route element={
                <AuthenticatedLayout 
                  desktopMenuItems={<DesktopMenuItems />}
                  mobileMenuItems={<MobileMenuItems />}
                  logo={<Logo className="w-10 h-10" />}
                />
              }>
                <Route path={appConfig.pages.home} element={<Navigate to={appConfig.pages.dashboard} />} />
                <Route path={appConfig.pages.dashboard} element={<Dashboard />} />
                <Route path={appConfig.pages.profile} element={<Profile />} />
                <Route path={appConfig.pages.editName} element={<EditName />} />
                <Route path={appConfig.pages.editEmail} element={<EditEmail />} />
                <Route path={appConfig.pages.changePassword} element={<ChangePassword />} />
                <Route path={appConfig.pages.deleteAccount} element={<DeleteAccount />} />
              </Route>
              <Route element={<PublicLayout logo={<Logo className="w-20 h-20" />} />}>
                <Route path={appConfig.pages.signIn} element={<SignIn />} />
                <Route path={appConfig.pages.signUp} element={<SignUp />} />
                <Route path={appConfig.pages.resetPassword} element={<ResetPassword />} />
                <Route path={appConfig.pages.firebaseActions} element={<FirebaseAuthActions />} />
              </Route>
            </Routes>
          </LoadingProvider>
        </AuthProvider>
      </ConfigProvider>
    </Router>
  );
}

export default App;
