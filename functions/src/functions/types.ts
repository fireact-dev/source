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

export interface UserPermissions {
    [key: string]: string[] | undefined;
}

export interface SubscriptionData {
    permissions: UserPermissions;
    [key: string]: any;
}

export interface UserData {
    display_name: string | null;
    avatar_url: string | null;
    create_timestamp: number;
}

export interface InviteData {
    email: string;
    subscription_id: string;
    subscription_name: string;
    host_uid: string;
    host_name: string;
    status: 'pending' | 'accepted' | 'rejected' | 'revoked';
    create_time: FirebaseFirestore.Timestamp;
    permissions: string[];
    accept_time?: FirebaseFirestore.Timestamp;
    accepted_by?: string;
    reject_time?: FirebaseFirestore.Timestamp;
    rejected_by?: string;
    revoke_time?: FirebaseFirestore.Timestamp;
    revoked_by?: string;
}

export interface AcceptInviteData {
    inviteId: string;
}

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

export interface Permission {
    label: string;
    default: boolean;
    admin: boolean;
}

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
