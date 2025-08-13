import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoadingProvider } from './contexts/LoadingContext';
import { ConfigProvider } from './contexts/ConfigContext';
import SignIn from './components/SignIn';
import SignUp from './components/SignUp';
import Profile from './components/Profile';
import EditName from './components/EditName';
import EditEmail from './components/EditEmail';
import ResetPassword from './components/ResetPassword';
import FirebaseAuthActions from './components/FirebaseAuthActions';
import ChangePassword from './components/ChangePassword';
import DeleteAccount from './components/DeleteAccount';
import AuthenticatedLayout from './layouts/AuthenticatedLayout';
import PublicLayout from './layouts/PublicLayout';
import Logo from './components/Logo';
import appConfig from './config/app.config.json';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './i18n/en';
import zh from './i18n/zh';
import de from './i18n/de';
import zhtw from './i18n/zh-tw';
import fr from './i18n/fr';
import es from './i18n/es';
import CreatePlan from './components/CreatePlan';
import Home from './components/Home';
import SubscriptionDashboard from './components/SubscriptionDashboard';
import SubscriptionLayout from './layouts/SubscriptionLayout';
import { SubscriptionDesktopMenu, SubscriptionMobileMenu } from './components/SubscriptionMenuItems';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { MainDesktopMenu, MainMobileMenu } from './components/navigation/MainMenuItems';
import Billing from './components/Billing';
import SubscriptionSettings from './components/SubscriptionSettings';
import ProtectedSubscriptionRoute from './components/ProtectedSubscriptionRoute';
import UserList from './components/UserList';
import InviteUser from './components/InviteUser';
import ChangePlan from './components/ChangePlan';
import CancelSubscription from './components/CancelSubscription';
import ManagePaymentMethods from './components/ManagePaymentMethods';
import UpdateBillingDetails from './components/UpdateBillingDetails';
import TransferSubscriptionOwnership from './components/TransferSubscriptionOwnership';


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
      },
      zhtw: {
        translation: zhtw
      },
      de: {
        translation: de
      },
      fr: {
        translation: fr
      },
      es: {
        translation: es
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
                  desktopMenuItems={<MainDesktopMenu />}
                  mobileMenuItems={<MainMobileMenu />}
                  logo={<Logo className="w-10 h-10" />}
                />
              }>
                <Route path={appConfig.pages.home} element={<Navigate to={appConfig.pages.dashboard} />} />
                <Route path={appConfig.pages.dashboard} element={<Home />} />
                <Route path={appConfig.pages.profile} element={<Profile />} />
                <Route path={appConfig.pages.editName} element={<EditName />} />
                <Route path={appConfig.pages.editEmail} element={<EditEmail />} />
                <Route path={appConfig.pages.changePassword} element={<ChangePassword />} />
                <Route path={appConfig.pages.deleteAccount} element={<DeleteAccount />} />
                <Route path={appConfig.pages.createPlan} element={<CreatePlan />} />
              </Route>
              
              <Route path={appConfig.pages.subscription} element={
                <SubscriptionProvider>
                  <SubscriptionLayout 
                    desktopMenu={<SubscriptionDesktopMenu />}
                    mobileMenu={<SubscriptionMobileMenu />}
                    logo={<Logo className="w-10 h-10" />}
                  />
                </SubscriptionProvider>
              }>
                <Route index element={
                  <ProtectedSubscriptionRoute requiredPermissions={['access']}>
                    <SubscriptionDashboard />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.users} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['admin']}>
                    <UserList />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.invite} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['admin']}>
                    <InviteUser />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.billing} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['admin']}>
                    <Billing />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.settings} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['admin']}>
                    <SubscriptionSettings />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.changePlan} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['owner']}>
                    <ChangePlan />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.cancelSubscription} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['owner']}>
                    <CancelSubscription />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.managePaymentMethods} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['owner']}>
                    <ManagePaymentMethods />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.updateBillingDetails} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['owner']}>
                    <UpdateBillingDetails />
                  </ProtectedSubscriptionRoute>
                } />
                <Route path={appConfig.pages.transferOwnership} element={
                  <ProtectedSubscriptionRoute requiredPermissions={['owner']}>
                    <TransferSubscriptionOwnership />
                  </ProtectedSubscriptionRoute>
                } />
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
