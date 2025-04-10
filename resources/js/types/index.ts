import { type LucideIcon } from 'lucide-react';
import { Theme } from './theme';

export interface Organization {
    id: number;
    name: string;
    ulid: string;
    invite_link: string;
}

export interface User {
    id: number;
    name: string;
    email: string;
    current_organization?: Organization;
    organizations: Organization[];
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
}

export interface Offer {
    id: number;
    name: string;
    description: string | null;
    status: string;
    organization_id: number;
    theme_id: number | null;
    theme: Theme | null;
    created_at: string;
    updated_at: string;
} 