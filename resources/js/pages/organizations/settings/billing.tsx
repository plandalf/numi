import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import SettingsLayout from '@/layouts/settings-layout';
import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { NumiPopupEmbed, BillingPortalEmbed } from '@plandalf/react';
import { CheckCircle, DollarSign, Users, Clock } from 'lucide-react';
import { Link } from '@/components/ui/link';


interface PriceInfo {
    id: string;
    currency: string;
    unit_amount: number;
    unit_amount_decimal: string;
    type: string;
    recurring: {
        interval: string;
        interval_count: number;
    } | null;
    product: {
        id: string;
        name: string;
        description: string;
    };
    formatted_amount: string;
    formatted_with_interval: string;
}

interface Subscription {
    id: number;
    stripe_id: string;
    type: string;
    stripe_status: string;
    stripe_price: string | null;
    quantity: number | null;
    trial_ends_at: string | null;
    ends_at: string | null;
    created_at: string;
    updated_at: string;
    active: boolean;
    on_trial: boolean;
    canceled: boolean;
    trial_days_left: number;
    product_name: string | null;
    price_info: PriceInfo | null;
    items: Array<{
        id: number;
        stripe_id: string;
        stripe_product: string;
        stripe_price: string;
        quantity: number | null;
        price_info: PriceInfo | null;
    }>;
}

interface BillingProps {
    subscriptions: Subscription[];
    portalCustomerToken?: string | null;
}

export default function Billing({ subscriptions, portalCustomerToken }: BillingProps) {
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutId, setCheckoutId] = useState<string | null>(null);
    
    // Get the active subscription
    const activeSubscription = subscriptions?.find(sub => sub.active) || subscriptions?.find(sub => sub.on_trial);
    const isPaid = subscriptions?.some(sub => sub.active && !sub.on_trial) || false;
    const isOnTrial = subscriptions?.some(sub => sub.on_trial) || false;
    const trialSubscription = subscriptions?.find(sub => sub.on_trial);
    const trialDaysLeft = trialSubscription?.trial_days_left || 0;

    // Check for success message from URL params or session
    const urlParams = new URLSearchParams(window.location.search);
    const messageCheckoutId = urlParams.get('checkoutId');
    
    // Set checkout ID from URL if present
    if (messageCheckoutId && !checkoutId) {
        setCheckoutId(messageCheckoutId);
    }

    const getSubscriptionStatus = () => {
        if (isPaid) return { label: 'Active', variant: 'default' as const };
        if (isOnTrial) return { label: `Trial (${trialDaysLeft} days left)`, variant: 'secondary' as const };
        return { label: 'No Active Plan', variant: 'outline' as const };
    };

    const getPlanName = () => {
        if (activeSubscription?.product_name) {
            return activeSubscription.product_name;
        }
        if (activeSubscription) {
            return `${activeSubscription.type.charAt(0).toUpperCase()}${activeSubscription.type.slice(1)} Plan`;
        }
        return 'No Active Plan';
    };

    const getPlanPrice = () => {
        if (activeSubscription?.price_info) {
            return activeSubscription.price_info.formatted_with_interval;
        }
        // Check if any subscription items have price info
        if (activeSubscription?.items?.length) {
            const itemWithPrice = activeSubscription.items.find(item => item.price_info);
            if (itemWithPrice?.price_info) {
                return itemWithPrice.price_info.formatted_with_interval;
            }
        }
        return null;
    };

    const getPlanDetails = () => {
        if (!activeSubscription) {
            return {
                name: 'No Active Plan',
                price: null,
                status: 'inactive',
                description: 'No subscription found'
            };
        }

        if (isOnTrial) {
            return {
                name: getPlanName(),
                price: 'Free Trial',
                status: 'trial',
                description: `Trial expires in ${trialDaysLeft} days`
            };
        }

        if (isPaid) {
            return {
                name: getPlanName(),
                price: getPlanPrice(),
                status: 'active',
                description: `Active since ${new Date(activeSubscription.created_at).toLocaleDateString()}`
            };
        }

        return {
            name: getPlanName(),
            price: null,
            status: 'inactive',
            description: 'Subscription not active'
        };
    };

    const planDetails = getPlanDetails();

    const status = getSubscriptionStatus();

    return (
        <SettingsLayout>
            <Head title="Billing & Subscription" />

            <BillingPortalEmbed
                domain={import.meta.env.VITE_PLANDALF_DOMAIN}
                customerToken={portalCustomerToken || undefined}
            />
            
            <div className="space-y-6 hidden">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold tracking-tight">Billing & Subscription</h1>
                    <p className="text-muted-foreground">
                        Manage your subscription and billing information
                    </p>
                </div>

                {/* Current Plan Section */}
                <div className="bg-background border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Current Plan
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Your current subscription and billing details
                            </p>
                        </div>
                        <Badge variant={status.variant}>
                            {status.label}
                        </Badge>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Users className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <div className="font-medium">{planDetails.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {planDetails.description}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="font-semibold">
                                    {planDetails.price || 'Free'}
                                </div>
                                {activeSubscription && (
                                    <div className="text-sm text-muted-foreground">
                                        Stripe ID: {activeSubscription.stripe_id.substring(0, 12)}...
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {isOnTrial && trialDaysLeft > 0 && (
                            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <Clock className="h-4 w-4 text-amber-600" />
                                <div className="text-sm text-amber-700">
                                    <span className="font-medium">Trial ends in {trialDaysLeft} days.</span>
                                    <span className="block text-amber-600">Upgrade to continue using all features.</span>
                                </div>
                            </div>
                        )}
                        
                        <Separator />
                        
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="text-sm font-medium">Plan Features</div>
                                <div className="text-sm text-muted-foreground">
                                    Unlimited offers, advanced analytics, priority support
                                </div>
                            </div>
                            <Button 
                                onClick={() => setIsCheckoutOpen(true)}
                                disabled={isPaid}
                                className="min-w-[120px]"
                            >
                                {isPaid ? 'Active' : 'Upgrade'}
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const el = document.getElementById('billing-portal');
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }}
                            >
                                Manage Subscription
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Subscription Details */}
                {subscriptions && subscriptions.length > 0 && (
                    <div className="bg-background border rounded-lg p-6">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Subscription Details</h3>
                            <div className="space-y-3">
                                {subscriptions.map((subscription) => (
                                    <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="space-y-1">
                                            <div className="font-medium">
                                                {subscription.product_name || `${subscription.type} Plan`}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Status: {subscription.stripe_status} • 
                                                Type: {subscription.type} • 
                                                Created: {new Date(subscription.created_at).toLocaleDateString()}
                                            </div>
                                            {subscription.items && subscription.items.length > 0 && (
                                                <div className="text-xs text-muted-foreground">
                                                    Items: {subscription.items.map(item => 
                                                        item.price_info?.product?.name || item.stripe_price
                                                    ).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <Badge variant={
                                                subscription.active ? 'default' : 
                                                subscription.on_trial ? 'secondary' : 
                                                'outline'
                                            }>
                                                {subscription.active ? 'Active' : 
                                                 subscription.on_trial ? 'Trial' : 
                                                 subscription.canceled ? 'Canceled' : 'Inactive'}
                                            </Badge>
                                            <div className="space-y-1">
                                                {subscription.price_info && (
                                                    <div className="text-sm font-medium text-muted-foreground">
                                                        {subscription.price_info.formatted_with_interval}
                                                    </div>
                                                )}
                                                {(subscription.trial_ends_at || subscription.ends_at) && (
                                                    <div className="text-xs text-muted-foreground">
                                                        {subscription.trial_ends_at ? 
                                                            `Trial ends: ${new Date(subscription.trial_ends_at).toLocaleDateString()}` :
                                                            subscription.ends_at ? 
                                                            `Ends: ${new Date(subscription.ends_at).toLocaleDateString()}` : ''
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Success Alert */}
                {checkoutId && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertTitle className="text-green-800">Payment Successful!</AlertTitle>
                        <AlertDescription className="text-green-700">
                            <div className="space-y-2">
                                <div>
                                    <span className="font-medium">Checkout ID:</span> {checkoutId}
                                </div>
                                <div>
                                    Your subscription has been activated. You should see the changes reflected above shortly.
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setCheckoutId(null)}
                                    className="mt-2 border-green-300 text-green-700 hover:bg-green-100"
                                >
                                    Dismiss
                                </Button>
                            </div>
                        </AlertDescription>
                    </Alert>
                )}
            </div>

        

            {/* Numi Popup Embed */}
            <NumiPopupEmbed
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                offerId={import.meta.env.VITE_PLANDALF_OFFER_ID}
                domain={import.meta.env.VITE_PLANDALF_DOMAIN}
                size="medium"
                onSuccess={(data) => {
                    console.log('Payment successful!', data);
                    const checkoutId = data.checkoutId || data.id || 'N/A';
                    setCheckoutId(checkoutId);
                    setIsCheckoutOpen(false);
                    
                    // Redirect to checkout completion page using Inertia
                    router.visit(`/organizations/settings/checkout-completion/${checkoutId}`);
                }}
                onClosed={(data) => {
                    console.log('Checkout closed', data);
                    setIsCheckoutOpen(false);
                }}
                onError={(error) => {
                    console.error('Checkout error:', error);
                    // Error handling could be enhanced here
                }}
            />
        </SettingsLayout>
    );
} 