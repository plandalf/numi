import { type LucideIcon } from 'lucide-react';

export interface Organization {
    id: number;
    name: string;
    ulid: string;
    invite_link: string;
    join_token: string;
    default_currency: string;
    subdomain: string;
    users?: (User & {
        pivot: {
            role: string;
        };
    })[];
    on_trial: boolean;
    trial_days_left: string;
    checkout_success_url?: string;
    checkout_cancel_url?: string;
    fulfillment_method?: string;
    default_delivery_method?: string;
    fulfillment_notification_email?: string;
    auto_fulfill_orders?: boolean;
    fulfillment_config?: Record<string, unknown>;
    external_platform_config?: Record<string, unknown>;
    subscriptions?: Subscription[];
}

export interface Subscription {
    id: string;
    product_name: string;
    stripe_status: string;
    type: string;
    quantity: number;
    created_at: string;
    updated_at: string;
    on_trial: boolean;
    trial_days_left: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    current_organization?: Organization;
    organizations: Organization[];
    onboarding_info?: {
        has_seen_products_tutorial: boolean;
        has_seen_orders_tutorial: boolean;
        has_seen_integrations_tutorial: boolean;
    };
}

export interface HostedPage {
    id: number;
    logo_image_id: number | null;
    logo_image: {
        id: number;
        url: string;
    };
    background_image_id: number | null;
    background_image: {
        id: number;
        url: string;
    };
    style: Record<string, unknown>;
    appearance: Record<string, unknown>;
}

export interface NavItem {
    title: string;
    href: string;
    route: string;
    icon: LucideIcon;
    hasNotification?: boolean;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface SharedData {
    auth: {
        user: User;
    };
    modules: Record<Modules, boolean>;
    onboarding: OnboardingData | null;
}

export interface PageProps {
    auth: {
        user: User;
    };
    onboarding: OnboardingData | null;
}

export enum Modules {
    BILLING = 'billing',
}

export interface Font {
    name: string;
    weights: string[];
    css_font_family?: string
}

export interface OnboardingStep {
    key: string;
    label: string;
    description: string;
    completed: boolean;
    value: number;
}

export interface OnboardingData {
    steps: OnboardingStep[];
    completion_percentage: number;
    is_complete: boolean;
    completed_steps: string[];
    incomplete_steps: string[];
    user_info_seen: string[];
    user_info_unseen: string[];
}
