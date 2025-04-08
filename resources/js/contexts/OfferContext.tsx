import React, { createContext, useState, useEffect } from 'react';

interface Block {
    id: string;
    type: string;
    props?: {
        name?: string;
        label?: string;
        placeholder?: string;
        required?: boolean;
        helpText?: string;
        minLength?: number;
        maxLength?: number;
        pattern?: string;
        rows?: number;
        currency?: string;
        minAmount?: number;
        maxAmount?: number;
        minDate?: string;
        maxDate?: string;
        options?: Array<{ value: string; label: string }>;
        layout?: 'horizontal' | 'vertical';
        showStrengthMeter?: boolean;
    };
}

interface Branch {
    condition?: {
        field: string;
        operator: string;
        value: any;
    };
    next_page: string;
}

interface PageView {
    promo: { blocks: Block[] };
    title: { blocks: Block[] };
    action: { blocks: Block[] };
    content: { blocks: Block[] };
    form: { blocks: Block[] };
}

interface PageItem {
    id: string;
    type: string;
    view: PageView;
    branches?: Branch[];
    next_page?: string;
}

interface Offer {
    pages: PageItem[];
    // ... other offer properties
}

interface OfferContextType {
    offer: Offer | null;
    loading: boolean;
    error: Error | null;
}

export const OfferContext = createContext<OfferContextType>({
    offer: null,
    loading: false,
    error: null
});

interface OfferProviderProps {
    children: React.ReactNode;
    initialOffer?: Offer;
}

export const OfferProvider: React.FC<OfferProviderProps> = ({ children, initialOffer }) => {
    const [offer, setOffer] = useState<Offer | null>(initialOffer || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
        if (!initialOffer) {
            setLoading(true);
            // Fetch offer data from API
            fetch('/api/offer')
                .then(res => res.json())
                .then(data => {
                    setOffer(data);
                    setLoading(false);
                })
                .catch(err => {
                    setError(err);
                    setLoading(false);
                });
        }
    }, [initialOffer]);
    
    return (
        <OfferContext.Provider value={{ offer, loading, error }}>
            {children}
        </OfferContext.Provider>
    );
}; 