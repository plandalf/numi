import { useState, useCallback, useContext } from 'react';
import { FormContext } from '@/contexts/FormContext';
import { type Block, type PageItem } from '@/types/offer';

export type ValidationErrors = Record<string, string[]>;

interface FormState {
    data: Record<string, any>;
    errors: ValidationErrors;
    currentPageId: string;
    pageHistory: string[];
    submitting: boolean;
}

interface UseCheckoutFormReturn {
    formState: FormState;
    setField: (name: string, value: any) => void;
    setErrors: (errors: ValidationErrors) => void;
    navigateTo: (pageId: string) => void;
    goBack: () => void;
}

export function useCheckoutForm(): UseCheckoutFormReturn {
    const context = useContext(FormContext);
    
    if (!context) {
        throw new Error('useCheckoutForm must be used within a FormProvider');
    }
    
    return context;
} 