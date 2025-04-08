import { useContext } from 'react';
import { OfferContext } from '@/contexts/OfferContext';

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

interface UseOfferReturn {
    offer: Offer | null;
    loading: boolean;
    error: Error | null;
}

export function useOffer(): UseOfferReturn {
    const context = useContext(OfferContext);
    
    if (!context) {
        throw new Error('useOffer must be used within an OfferProvider');
    }
    
    return context;
} 