export interface Product {
    id: number;
    name: string;
    lookup_key: string;
    gateway_provider: string | null;
    gateway_product_id: string | null;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    prices?: Price[];
}

export interface Price {
    id: number;
    product_id: number;
    parent_list_price_id: number | null;
    scope: 'list' | 'custom';
    pricing_model: 'one_time' | 'recurring' | 'tiered' | 'volume' | 'graduated';
    amount: number;
    currency: string;
    recurring_interval: string | null;
    recurring_interval_count: number | null;
    cancel_after_cycles: number | null;
    properties: {
        tiers?: Array<{
            min_quantity?: number;
            unit_amount?: number;
            upperBound?: number;
            price?: number;
        }>;
    } | null;
    gateway_provider: string | null;
    gateway_price_id: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
} 