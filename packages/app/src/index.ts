/*
  Public package exports

  This file re-exports all public components, contexts, hooks and utils from
  the `src` tree so the package build (tsup) can generate the JS and .d.ts files.
*/

// Components (pages / primary exports)
export { default as SignIn } from "./components/SignIn";
export { default as SignUp } from "./components/SignUp";
export { default as Profile } from "./components/Profile";
export { default as EditName } from "./components/EditName";
export { default as EditEmail } from "./components/EditEmail";
export { default as ResetPassword } from "./components/ResetPassword";
export { default as FirebaseAuthActions } from "./components/FirebaseAuthActions";
export { default as ChangePassword } from "./components/ChangePassword";
export { default as DeleteAccount } from "./components/DeleteAccount";

export { default as Home } from "./components/Home";
export { default as CreatePlan } from "./components/CreatePlan";
export { default as SubscriptionDashboard } from "./components/SubscriptionDashboard";
export { default as Billing } from "./components/Billing";
export { default as SubscriptionSettings } from "./components/SubscriptionSettings";

// Subscription / billing helpers
export { default as ChangePlan } from "./components/ChangePlan";
export { default as CancelSubscription } from "./components/CancelSubscription";
export { default as ManagePaymentMethods } from "./components/ManagePaymentMethods";
export { default as UpdateBillingDetails } from "./components/UpdateBillingDetails";
export { default as TransferSubscriptionOwnership } from "./components/TransferSubscriptionOwnership";
export { default as InviteUser } from "./components/InviteUser";
export { default as UserList } from "./components/UserList";

// Layouts & navigation
export { default as AuthenticatedLayout } from "./layouts/AuthenticatedLayout";
export { default as SubscriptionLayout } from "./layouts/SubscriptionLayout";
export { default as PublicLayout } from "./layouts/PublicLayout";
export { default as Logo } from "./components/Logo";

// Common components
export { default as Plans } from "./components/common/Plans";
export { default as BillingForm } from "./components/common/BillingForm";
export { default as Avatar } from "./components/common/Avatar";
export { default as Message } from "./components/common/Message";
export { default as Pagination } from "./components/common/Pagination";
export { default as InvoiceList } from "./components/InvoiceList";
export { default as InvoiceTable } from "./components/InvoiceTable";

// Admin / users
export { default as EditPermissionsModal } from "./components/EditPermissionsModal";
export { default as UserTable } from "./components/UserTable";

// Navigation menu pieces (export defaults)
export { MainDesktopMenu, MainMobileMenu } from "./components/navigation/MainMenuItems";
export { default as PrivateRoute } from "./components/navigation/PrivateRoute";
export { default as ProtectedSubscriptionRoute } from "./components/ProtectedSubscriptionRoute";

// Subscription-specific menu items (named exports)
export { SubscriptionDesktopMenu, SubscriptionMobileMenu } from "./components/navigation/SubscriptionMenuItems";

// Utilities & UI helpers
export { default as LanguageSwitcher } from "./components/LanguageSwitcher";

// Contexts (re-export everything they expose)
export * from "./contexts/ConfigContext";
export * from "./contexts/AuthContext";
export * from "./contexts/SubscriptionContext";
export * from "./contexts/LoadingContext";

// Hooks
export * from "./hooks/useSubscriptionInvoices";

// Utils
export * from "./utils/userUtils";

// Types
export * from "./types";
