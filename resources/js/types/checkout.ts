import type { OfferConfiguration, OfferItemType, Page, Price, Product } from '@/types/offer';
import React from 'react';
import { Font, HostedPage } from '.';
import { Discount } from './product';
import { Theme } from './theme';

export enum IntegrationClient {
  STRIPE = 'stripe',
  Plandalf = 'plandalf',
  STRIPE_TEST = 'stripe_test',
}

export type CheckoutItem = {
  id: number;
  name: string;
  quantity: number;
  currency: string;
  metadata?: Record<string, any>;

  subtotal: number;
  taxes: number;
  // exclusive_taxes?: number;
  inclusive_taxes?: number;
  shipping: number;
  discount: number;
  total: number;
  product?: Product;
  is_highlighted?: boolean;
  // is_tax_inclusive?: boolean;
  // tax_rate?: number;
  price?: Price;
  type: OfferItemType;
};

export interface CheckoutSession {

  id: string;

  status: 'open' | 'processing' | 'completed' | 'abandoned';

  properties: Record<string, any>;
  line_items: CheckoutItem[];

  is_test_mode: boolean;

  currency: string;
  subtotal: number;
  taxes: number;
  // exclusive_taxes: number;
  inclusive_taxes: number;
  shipping: number;
  discount: string;
  total: number;
  integration_client: IntegrationClient;

  // customer?: Customer;
  // shipping_address?: CheckoutAddress;
  // billing_address?: CheckoutAddress;

  metadata: Record<string, any>;
  discount_code?: string;
  publishable_key?: string;
  discounts?: Discount[];
  enabled_payment_methods?: string[];
  intent_mode?: 'setup' | 'payment';
  intent_type?: string;
  has_subscription_items?: boolean;
  has_onetime_items?: boolean;
  has_mixed_cart?: boolean;

  intent_state?: {
    can_proceed: boolean;
    blocked: boolean;
    reason?: string;
    intent_status?: string;
    requires_action: boolean;
    payment_confirmed: boolean;
    intent_id?: string;
    intent_type?: string;
  };

  payment_method?: {
    id: number;
    type: string;
    billing_details: {
      name?: string;
      email?: string;
      phone?: string;
      address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        postal_code?: string;
        country?: string;
      };
    };
    properties: Record<string, any>;
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  };

  customer?: {
    id: number;
    email?: string;
    name?: string;
  };

  // Metadata for UI/telemetry
  created_at?: string;
  current_page_id?: string;
}

export interface CheckoutPageProps {
  offer: OfferConfiguration;
  fonts: Font[];
  error?: string | null;
  embedDomain?: string;
  environment?: string;
  checkoutSession: CheckoutSession;
}

export interface TailwindLayoutConfig {
  name?: string;
  template: {
    type: string;
    props?: Record<string, any>;
    children?: Array<any>;
    id?: string;
  };
}

export interface TailwindLayoutRendererProps {
  theme: Theme;
  layoutConfig: TailwindLayoutConfig | string;
  contentMap?: Record<string, React.ReactNode>;
  page: Page;
  components?: Record<string, React.ComponentType<any>>;
  hostedPage?: HostedPage;
}


export interface NavigationBarProps extends React.HTMLAttributes<HTMLDivElement> {
  barStyle?: string;
  children?: React.ReactNode;
  className?: string;
}
