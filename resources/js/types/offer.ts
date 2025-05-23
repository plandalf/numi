import { RuleGroup } from "@/components/editor/condition-visibility-editor";
import { Theme } from "./theme";
import { EventAction } from "@/components/editor/interaction-event-editor";

export interface Offer {
    id: number;
    name: string;
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
    view: {
        first_page: string;
        pages: Record<string, Page>;
    };
    properties: Record<string, any> | null;
    transaction_webhook_url: string | null;
    items: OfferItem[];
    products: OfferProduct[];
    theme: Theme | null;
    screenshot: {
        id: number;
        url: string;
    } | null;
    created_at: string;
    updated_at: string;

}

export enum OfferItemType {
    STANDARD = 'standard',
    OPTIONAL = 'optional',
}

export interface OfferItem {
    id: number;
    name: string;
    key: string;
    default_price_id: number | null;
    is_required: boolean;
    sort_order: number;
    default_price: Price | null;
    created_at: string;
    updated_at: string;
    product: Product | null;
    prices: Price[];
    type: OfferItemType;
}

export interface Price {
    id: number;
    product_id: number;
    organization_id: number;
    parent_list_price_id?: number | null;
    scope: 'list' | 'custom';
    type: 'one_time' | 'recurring' | 'graduated' | 'volume' | 'package';
    amount: number;
    currency: string;
    properties?: Record<string, any> | null;
    name?: string | null;
    lookup_key?: string | null;
    renew_interval?: 'day' | 'week' | 'month' | 'year' | null;
    billing_anchor?: string | null;
    recurring_interval_count?: number | null;
    cancel_after_cycles?: number | null;
    gateway_provider?: string | null;
    gateway_price_id?: string | null;
    is_active: boolean;
    archived_at?: string | null;
    created_at?: string;
    updated_at?: string;
    product?: Product | null;
    metadata?: Record<"copy"|"tag_name", string>[] | null;
}

export interface OfferProduct extends Product {
    store_offer_product_id: number;
}

export interface Product {
    id: number;
    store_offer_product_id?: number | null;
    name: string;
    lookup_key: string;
    integration_id: number;
    description?: string | null;
    currency?: string;
    media_id?: number | null;
    media?: Media | null;
    is_active?: boolean;
    prices?: Price[];
    created_at?: string;
    updated_at?: string;
    gateway_provider?: string | null;
    gateway_product_id?: string | null;
    organization_id?: number;
    image?: string | null;
}

export interface OfferVariant {
    id: number;
    offer_id: number;
    product_id: number | null;
    product?: Product | null;
    name: string;
    description: string | null;
    media_id: number | null;
    media: Media | null;
    prices: Price[];
    currency?: string;
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

export interface Media {
    id: number;
    url: string;
}

export interface BlockProps {
    name?: string;
    label?: string;
    placeholder?: string;
    required?: boolean;
    helpText?: string;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
    rows?: number;
    minDate?: string;
    maxDate?: string;
    currency?: string;
    minAmount?: number;
    maxAmount?: number;
    showStrengthMeter?: boolean;
    defaultChecked?: boolean;
    layout?: 'horizontal' | 'vertical';
    options?: Array<{
        value: string;
        label: string;
    }>;
    mediaId?: number | null;
    src?: string;
    alt?: string;
    caption?: string;
    content?: string;
    icon?: string;
    variant?: string;

    object?: 'field' | 'block';
}

export interface Block {
    id: string;
    type: string;
    object: 'block' | 'field';
    content?: {
        value?: string;
        is_default_checked?: boolean;
        [key: string]: any;
    };
    interaction?: {
        isDisabled?: boolean;
        onClick?: EventAction[];
        onSelect?: EventAction[];
        onUnSelect?: EventAction[];
        [key: string]: any;
    };
    style?: {
        fontSize?: string;
        backgroundColor?: string;
        color?: string;
        textColor?: string;
        borderColor?: string;
        border?: string;
        hidden?: boolean;
        [key: string]: string | boolean | { conditional: RuleGroup } | undefined;
    };
    appearance?: {
        padding?: string;
        spacing?: string;
        visibility?: {
          conditional: RuleGroup;
        }
    };
    validation?: {
        isRequired?: boolean;
        pattern?: string;
        patternMessage?: string;
        minLength?: number;
        maxLength?: number;
        [key: string]: any;
    };
    props?: BlockProps;
    text?: Array<{
        object: 'text' | 'icon';
        props: BlockProps;
        annotations?: Record<string, boolean>;
        style?: Record<string, string>;
    }>;
    children?: Block[];
}

export interface ViewSection {
    style?: Record<string, string>;
    blocks: Block[];
}

export interface BranchCondition {
    field: string;
    operator: 'eq' | 'ne' | 'contains' | 'not_contains' | 'gt' | 'lt' | 'gte' | 'lte';
    value: string | number | boolean;
}

export interface Branch {
    conditions: BranchCondition[];
    target: string;
}

export interface FormField {
    name: string;
    type: string;
    label?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    validation?: string;
    pattern?: string;
    patternMessage?: string;
    minLength?: number;
    maxLength?: number;
    matchWith?: string;
    matchWithLabel?: string;
    autoComplete?: string;
    min?: string | number;
    max?: string | number;
    rows?: number;
    helpText?: string;
}

export type PageNextPage = {
    branches: any[];
    default_next_page: string | null;
};

export type PageType = 'page' | 'entry' | 'payment' | 'ending';

export type PageSection = {
    asContainer?: boolean;
    blocks: Block[];
    id?: string;
    label?: string;
    style?: Record<string, string>;
    appearance?: Record<string, string>;
};

export type FormSection = {
    fields: FormField[];
};

export type PageView = {
    [key: string]: PageSection;
};

export interface Page {
    id: string;
    name: string;
    type: PageType;
    position: { x: number; y: number };
    view: PageView;
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

export interface OfferConfiguration extends Offer {
    variants?: OfferVariant[];
}
