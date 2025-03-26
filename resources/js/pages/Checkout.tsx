import { Head } from '@inertiajs/react';

import { useEffect, useState } from 'react';

interface OfferConfiguration {
    id: string;
    view: Array<any>;
    client: string;
    variant?: string | null;
    variant_filters?: Record<string, any> | null;
}

interface EmbedConfig {
    paywall: string;
    collector: string;
    agent: string;
    placement: string;
    domain: string;
    client: string;
    cart_token?: string;
    variant?: string;
    variant_filters?: Record<string, any>;
}

const buildEmbedUrl = (config: EmbedConfig): string => {
    const baseUrl = `${config.domain}/v1/embed-paywall/index.html`;
    const p: Record<string, string> = {
    };

    // Add cart_token to params if it exists
    if (config.cart_token) {
        p['cart_token'] = config.cart_token;
    }

    // Add variant to params if it exists
    if (config.variant) {
        p['variant'] = config.variant;
    }


    const params = new URLSearchParams(p);

    return `${baseUrl}?${params.toString()}`;
};

// Helper function to get URL parameters
const getUrlParam = (param: string): string | null => {
    if (typeof window === 'undefined') return null;
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
};

// Helper function to update URL with a parameter without page reload
const updateUrlParam = (key: string, value: string): void => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set(key, value);
    window.history.replaceState({}, '', url.toString());
};

interface Props extends PageProps {
    offer: OfferConfiguration | null;
    error: string | null;
    agentToken: string;
    collectorId: string;
    environment: string;
    url: string;
    embedDomain: string;
    variant?: string | null;
    variantFilters?: Record<string, any> | null;
}

export default function Checkout({
                                     offer,
                                     error,
                                     agentToken,
                                     collectorId,
                                     environment,
                                     // url,
                                     embedDomain,
                                     variant,
                                     // variantFilters,
                                 }: Props) {
    // Get cart token from URL immediately - this happens during component initialization
    // before any rendering occurs
    const initialCartToken = getUrlParam('cart_token');

    // Listen for messages from the iframe
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // Verify the origin matches our embed domain
            if (event.origin !== new URL(embedDomain).origin) {
                return;
            }

            // Check if the message contains a cart token
            if (event.data && typeof event.data === 'object' && event.data.cart_token) {
                const newCartToken = event.data.cart_token;

                // Update URL with the cart token
                updateUrlParam('cart_token', newCartToken);
            }
        };

        window.addEventListener('message', handleMessage);

        // Clean up event listener on unmount
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, [embedDomain]);

    if (error) {
        return (
            <>
                <Head title="Offer Unavailable" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="text-center">
                                    <h1 className="text-2xl font-semibold mb-4 text-gray-800">Oops!</h1>
                                    <p className="text-gray-600 mb-4">{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!offer) {
        return null;
    }

    const embedConfig: EmbedConfig = {
        // paywall: offer.id,
        // collector: collectorId,
        // agent: agentToken,
        // placement: environment,
        domain: embedDomain,
        variant,
        client: offer.client,
        ...(initialCartToken && { cart_token: initialCartToken }),
        ...(offer.variant && { variant: offer.variant }),
        // ...(offer.variant_filters && { variant_filters: offer.variant_filters }),
    };

    const embedUrl = buildEmbedUrl(embedConfig);
    return (
        <>
            <Head title="Checkout" />
            <div className="h-screen w-screen">
                <iframe
                    src={embedUrl}
                    frameBorder="0"
                    className="w-full h-full border-0"
                    title="Payment Form"
                />
            </div>
        </>
    );
}
