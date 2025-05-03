import type { OfferConfiguration, Page } from '@/types/offer';
import React from 'react';

export enum IntegrationClient {
  STRIPE = 'stripe',
  Plandalf = 'plandalf',
}

export type CheckoutItem = {
  id: string;

  slot: string;

  name: string;
  // price: number;
  quantity: number;
  image?: string;
  metadata?: Record<string, any>;

  subtotal: number;
  taxes: number;
  shipping: number;
  discount: number;
  total: number;
};

export interface CheckoutSession {

  id: string;

  status: 'open' | 'processing' | 'completed' | 'abandoned';

  line_items: CheckoutItem[];

  currency: string;
  subtotal: number;
  taxes: number;
  shipping: number;
  discount: number;
  total: number;
  integration_client: IntegrationClient;

  // customer?: Customer;
  // shipping_address?: CheckoutAddress;
  // billing_address?: CheckoutAddress;

  metadata: Record<string, any>;
  discount_code?: string;
  publishable_key?: string;
}

export interface CheckoutPageProps {
  offer: OfferConfiguration;
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
  layoutConfig: TailwindLayoutConfig | string;
  contentMap?: Record<string, React.ReactNode>;
  page: Page;
  components?: Record<string, React.ComponentType<any>>;
}


export interface NavigationBarProps extends React.HTMLAttributes<HTMLDivElement> {
  barStyle?: string;
  children?: React.ReactNode;
  className?: string;
}
