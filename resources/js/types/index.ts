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
    style: Record<string, any>;
    appearance: Record<string, any>;
}

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
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
}

export interface PageProps {
    auth: {
        user: User;
    };
}

export enum Modules {
    BILLING = 'billing',
}

export interface Font {
    name: string;
    weights: string[];
    css_font_family?: string
}
