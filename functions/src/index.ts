import { initializeApp } from 'firebase-admin/app';
import * as configFile from './saasConfig.json';
import type { Plan, Permission } from './functions/types';

// Initialize Firebase Admin at the entry point
initializeApp();

// Set up global config
declare global {
    var saasConfig: {
        stripe: {
            secret_api_key: string;
            end_point_secret: string;
        };
        emulators: {
            enabled: boolean;
            useTestKeys: boolean;
        };
        plans: Plan[];
        permissions: Record<string, Permission>;
    };
}
global.saasConfig = configFile;

// Export cloud functions
export { createSubscription } from './functions/createSubscription';
export { createInvite } from './functions/createInvite';
export { getSubscriptionUsers } from './functions/getSubscriptionUsers';
export { acceptInvite } from './functions/acceptInvite';
export { rejectInvite } from './functions/rejectInvite';
export { revokeInvite } from './functions/revokeInvite';
export { removeUser } from './functions/removeUser';
export { updateUserPermissions } from './functions/updateUserPermissions';
export { stripeWebhook } from './functions/stripeWebhook';
export { changeSubscriptionPlan } from './functions/changeSubscriptionPlan';
export { cancelSubscription } from './functions/cancelSubscription';
export { getPaymentMethods } from './functions/getPaymentMethods';
export { createSetupIntent } from './functions/createSetupIntent';
export { setDefaultPaymentMethod } from './functions/setDefaultPaymentMethod';
export { deletePaymentMethod } from './functions/deletePaymentMethod';
export { updateBillingDetails } from './functions/updateBillingDetails';
export { getBillingDetails } from './functions/getBillingDetails';
export { transferSubscriptionOwnership } from './functions/transferSubscriptionOwnership';
