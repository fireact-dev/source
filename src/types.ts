export interface Plan {
    id: string;
    titleKey: string;
    popular: boolean;
    priceIds: string[];
    currency: string;
    price: number;
    frequency: string;
    descriptionKeys: string[];
    free: boolean;
    legacy: boolean;
}

// Generic type for user permissions
export type UserPermissions = Record<string, string[]>;

// Generic type for subscription settings
export type SubscriptionSettings = Record<string, string>;

export interface Subscription {
    id: string;
    plan_id: string;
    status: string;
    permissions: UserPermissions;
    settings?: SubscriptionSettings;
    owner_id: string;
}

export interface UserDetails {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    create_timestamp: number;
    permissions: string[];
    status?: 'active' | 'pending';
    invite_id?: string;
    pending_permissions?: string[];
}

export interface SubscriptionUserDetails {
    users: UserDetails[];
    total: number;
}

export interface Invite {
    id: string;
    subscription_id: string;
    subscription_name: string;
    host_uid: string;
    host_name: string;
    email: string;
    status: 'pending' | 'accepted' | 'rejected' | 'revoked';
    create_time: any;
    permissions: string[];
    accept_time?: any;
    accepted_by?: string;
    reject_time?: any;
    rejected_by?: string;
    revoke_time?: any;
    revoked_by?: string;
}

export interface Invoice {
    id: string;
    amount_due: number;
    amount_paid: number;
    amount_remaining: number;
    currency: string;
    customer: string;
    customer_email: string | null;
    customer_name: string | null;
    description: string | null;
    hosted_invoice_url: string | null;
    invoice_pdf: string | null;
    number: string | null;
    paid: boolean;
    payment_intent: string | null;
    period_end: number;
    period_start: number;
    status: string;
    subscription_id: string;
    total: number;
    created: number;
    due_date: number | null;
    updated: number;
}

export interface InvoiceListResponse {
    invoices: Invoice[];
    total: number;
}

export interface StripeConfig {
    public_api_key: string;
}

declare module '@fireact.dev/core' {
    interface ConfigContextType {
        stripe: {
            public_api_key: string;
        };
    }

    interface User {
        permissions?: UserPermissions;
    }
}

// Need to augment the auth module to recognize our custom claims
declare module 'firebase/auth' {
    interface User {
        permissions?: UserPermissions;
    }
}
