export interface Offer {
    id: number;
    name: string | null;
    description: string | null;
    product_image_id: number | null;
    product_image: {
        id: number;
        url: string;
    } | null;
    status: 'draft' | 'published' | 'archived';
    default_currency: string;
    is_subscription_enabled: boolean;
    is_one_time_enabled: boolean;
    organization_id: number;
    view: Record<string, any> | null;
    properties: Record<string, any> | null;
    transaction_webhook_url: string | null;
    variants: OfferVariant[];
    created_at: string;
    updated_at: string;
}

export interface OfferVariant {
    id: number;
    offer_id: number;
    name: string;
    description: string | null;
    type: 'one_time' | 'subscription';
    pricing_model: 'standard' | 'graduated' | 'volume' | 'package';
    amount: number | null;
    currency: string;
    media_id: number | null;
    media: {
        id: number;
        url: string;
    } | null;
    properties: {
        tiers?: Array<{
            from: number;
            to: number | null;
            unit_amount: number;
            flat_amount?: number;
        }>;
        package?: {
            size: number;
            unit_amount: number;
        };
    } | null;
    created_at: string;
    updated_at: string;
}

export interface TierConfig {
    from: number;
    to: number | null;
    unit_amount: number;
    flat_amount?: number;
}

export interface PackageConfig {
    size: number;
    unit_amount: number;
}

export type TextAnnotations = {
    bold?: boolean;
};

export type TextContent = {
    href: string | null;
    props: {
        link: string | null;
        content: string;
    };
    object: 'text';
    plain_text?: string | null;
    annotations?: TextAnnotations;
};

export type IconContent = {
    props: {
        icon: string;
        variant: string;
    };
    style?: Record<string, string>;
    object: 'icon';
};

export type BlockContent = TextContent | IconContent;

export type Block = {
    id?: string;
    text?: BlockContent[];
    type: string;
    props?: Record<string, any>;
    style?: Record<string, string>;
    object: string;
    children?: Block[];
};

export type ViewSection = {
    style?: Record<string, string>;
    blocks: Block[];
};

export type PageView = {
    promo: ViewSection;
    title?: ViewSection;
    action: ViewSection;
    content: ViewSection;
};

export type PageNextPage = {
    branches: any[];
    default_next_page: string | null;
};

export type PageType = 'page' | 'entry' | 'ending';

export interface BranchCondition {
    field: string;
    operator: string;
    value: string;
}

export interface Page {
    id: string;
    name: string;
    type: PageType;
    position: { x: number; y: number };
    view: {
        promo: { blocks: Block[] };
        title: { blocks: Block[] };
        action: { blocks: Block[] };
        content: { blocks: Block[] };
    };
    layout: { sm: string };
    provides: string[];
    next_page: {
        branches: {
            next_page: string | null;
            condition: BranchCondition;
        }[];
        default_next_page: string | null;
    };
}

export type OfferView = {
    id: string;
    pages: Record<string, Page>;
    first_page: string;
}; 