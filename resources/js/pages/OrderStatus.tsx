import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle,
  Clock,
  Package,
  Mail,
  Download
} from 'lucide-react';

const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  // Convert from cents to dollars
  const amountInDollars = amount / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amountInDollars);
};

interface OrderStatusProps {
  order: {
    id: string; // UUID from getRouteKey()
    order_number: number;
    status: {
      value: string;
      label: string;
    };
    currency: string;
    total_amount: number;
    completed_at: string;
    created_at: string;
    
    // Payment information
    intent_id?: string;
    intent_type?: string;
    payment_id?: string;
    payment_method_id?: string;
    
    // Receipt URL
    receipt_url: string;
    
    fulfillment_method: {
      value: string;
      label: string;
    };
    fulfillment_config: Record<string, unknown>;
    fulfillment_notified: boolean;
    fulfillment_notified_at: string;
    fulfillment_summary: {
      total_items: number;
      fulfilled_items: number;
      pending_items: number;
      unprovisionable_items: number;
    };
    customer: {
      id: number;
      name: string;
      email: string;
    } | null;
    organization?: {
      id: number;
      name: string;
      subdomain: string;
    };
    items: Array<{
      id: number;
      quantity: number;
      total_amount: number;
      fulfillment_status: string;
      fulfillment_notes: string;
      tracking_number: string;
      tracking_url: string;
      fulfilled_at: string;
      price: {
        id: number;
        amount: number;
        currency: string;
        product: {
          id: number;
          name: string;
          description: string;
          image_url: string;
        };
      };
    }>;
    checkout_session: {
      id: number;
      status: string;
      discounts: Array<{
        name: string;
        percent_off?: number;
        amount_off?: number;
      }>;
      properties: Record<string, unknown>;
      payment_method?: {
        id: number;
        type: string;
        brand?: string;
        last4?: string;
        exp_month?: number;
        exp_year?: number;
        billing_details?: {
          email?: string;
          name?: string;
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
        display_name: string;
      };
    } | null;
    events: Array<{
      id: number;
      type: string;
      description: string;
      metadata: Record<string, unknown>;
      created_at: string;
      user: {
        id: number;
        name: string;
        email: string;
      } | null;
    }>;
  };
}

const OrderStatus: React.FC<OrderStatusProps> = ({ order }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#f6f7f5] py-10">
      <div className="max-w-5xl mx-auto rounded-2xl bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between px-8 pt-8 pb-4 bg-[#f6f7f5]">
          <div className="flex items-center gap-4">
            <img src="/logo.svg" alt="Logo" className="h-10 w-10" />
            <span className="text-2xl font-bold tracking-tight text-green-900">
              {order.organization?.name || 'Store'}
            </span>
            <span className="ml-6 text-gray-400 font-medium">Orders</span>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            {/* <Button variant="outline" className="font-semibold">Go to store</Button> */}
            {/* <Button variant="default" className="font-semibold">Buy again</Button> */}
          </div>
        </div>

        {/* Personalized Greeting */}
        {order.customer?.name && (
          <div className="px-8 pt-6 pb-2">
            <h2 className="text-lg font-semibold text-gray-900">Thank you, {order.customer.name}!</h2>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8 px-8 py-8">
          {/* Left Column */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Order Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order <span className="text-gray-700">#{order.order_number}</span></h2>
                <p className="text-gray-500 text-sm mt-1">Confirmed {formatDate(order.created_at)}</p>
              </div>
              <div className="flex items-center gap-2 mt-2 md:mt-0">
                {getStatusIcon(order.status.value)}
                <Badge variant="outline" className="text-sm px-3 py-1 border-0 bg-gray-100 text-gray-700 font-medium">
                  {order.status.label}
                </Badge>
              </div>
            </div>

            {/* Order Details */}
            <div className="rounded-xl bg-[#f8fafc] shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Contact information</div>
                  <div className="text-sm text-gray-900 font-medium">{order.customer?.email || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Payment</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {order.checkout_session?.payment_method ? (
                      <>
                        {order.checkout_session.payment_method.display_name}
                        {order.checkout_session.payment_method.exp_month && order.checkout_session.payment_method.exp_year ? (
                          <span className="text-xs text-gray-500"> &nbsp;exp {order.checkout_session.payment_method.exp_month}/{order.checkout_session.payment_method.exp_year}</span>
                        ) : null}
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Company</div>
                  <div className="text-sm text-gray-900 font-medium">—</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Billing address</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {(() => {
                      const address = order.checkout_session?.payment_method?.billing_details?.address;
                      if (!address) return '—';
                      
                      const parts: string[] = [];
                      if (address.line1) parts.push(address.line1);
                      if (address.line2) parts.push(address.line2);
                      
                      const cityParts: string[] = [];
                      if (address.city) cityParts.push(address.city);
                      if (address.state) cityParts.push(address.state);
                      if (address.postal_code) cityParts.push(address.postal_code);
                      
                      if (cityParts.length > 0) {
                        parts.push(cityParts.join(', '));
                      }
                      
                      if (address.country) parts.push(address.country);
                      
                      return parts.length > 0 ? parts.map((part, index) => <div key={index}>{part}</div>) : '—';
                    })()}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Shipping address</div>
                  <div className="text-sm text-gray-900 font-medium">—</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Location</div>
                  <div className="text-sm text-gray-900 font-medium">—</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Shipping method</div>
                  <div className="text-sm text-gray-900 font-medium">—</div>
                </div>
              </div>
            </div>

            {/* Transaction Information */}
            <div className="rounded-xl bg-[#f8fafc] shadow-sm p-6">
              <div className="mb-4 text-base font-semibold text-gray-900">Transaction Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {order.payment_id || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Intent Type</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {order.intent_type || '—'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Payment Method ID</div>
                  <div className="text-sm text-gray-900 font-medium">
                    {order.payment_method_id || '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl bg-[#f8fafc] shadow-sm p-6">
              <div className="mb-4 text-base font-semibold text-gray-900">Order timeline</div>
              <div className="space-y-4">
                {order.events.map((event) => (
                  <div key={event.id} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(event.created_at)}</p>
                      {event.user && (
                        <p className="text-xs text-gray-400 mt-1">by {event.user.name}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Sidebar) */}
          <div className="w-full lg:w-96 flex-shrink-0 space-y-8">
            {/* Items Summary */}
            <div className="rounded-xl bg-[#f8fafc] shadow-sm p-6">
              <div className="mb-4 text-base font-semibold text-gray-900">Summary</div>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                      {item.price.product.image_url ? (
                        <img src={item.price.product.image_url} alt={item.price.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.price.product.name}</div>
                      <div className="text-xs text-gray-500 truncate">{item.price.product.description}</div>
                      <div className="text-xs text-gray-400">Qty: {item.quantity}</div>
                    </div>
                    <div className="text-right font-medium text-gray-900">
                      {formatCurrency(item.total_amount, item.price.currency)}
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.total_amount, order.currency)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span>
                  <span>—</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Taxes</span>
                  <span>—</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 mt-2">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount, order.currency)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="rounded-xl bg-[#f8fafc] shadow-sm p-6">
              <div className="mb-4 text-base font-semibold text-gray-900">Actions</div>
              <div className="space-y-3">
                <Button variant="outline" className="w-full" asChild>
                  <a href={`mailto:${order.customer?.email || ''}?subject=Order ${order.order_number}`}>
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Support
                  </a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={order.receipt_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderStatus;
