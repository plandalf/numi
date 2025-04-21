import { type LucideIcon } from 'lucide-react';

export interface Organization {
    id: number;
    name: string;
    ulid: string;
    invite_link: string;
    join_token: string;
    users?: (User & {
        pivot: {
            role: string;
        };
    })[];
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

export interface PageProps {
    auth: {
        user: User;
    };
}
