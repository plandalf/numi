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