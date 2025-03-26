import { type LucideIcon } from 'lucide-react';

export interface Organization {
    id: number;
    name: string;
    ulid: string;
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

export interface SharedData {
    auth: {
        user: User;
    };
} 