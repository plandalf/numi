import { useState, useCallback } from 'react';

export type ValidationErrors = Record<string, string[]>;

interface FormState {
    data: Record<string, any>;
    errors: ValidationErrors;
    currentPageId: string;
    pageHistory: string[];
    submitting: boolean;
}

interface UseFormReturn {
    formState: FormState;
    setField: (name: string, value: any) => void;
    setErrors: (errors: ValidationErrors) => void;
    navigateTo: (pageId: string) => void;
    goBack: () => void;
}

export function useForm(): UseFormReturn {
    const [formState, setFormState] = useState<FormState>({
        data: {},
        errors: {},
        currentPageId: '',
        pageHistory: [],
        submitting: false
    });
    
    const setField = useCallback((name: string, value: any) => {
        setFormState(prev => ({
            ...prev,
            data: {
                ...prev.data,
                [name]: value
            }
        }));
    }, []);
    
    const setErrors = useCallback((errors: ValidationErrors) => {
        setFormState(prev => ({
            ...prev,
            errors
        }));
    }, []);
    
    const navigateTo = useCallback((pageId: string) => {
        setFormState(prev => ({
            ...prev,
            currentPageId: pageId,
            pageHistory: [...prev.pageHistory, pageId]
        }));
    }, []);
    
    const goBack = useCallback(() => {
        setFormState(prev => {
            const newHistory = [...prev.pageHistory];
            newHistory.pop(); // Remove current page
            const previousPage = newHistory[newHistory.length - 1];
            
            return {
                ...prev,
                currentPageId: previousPage || '',
                pageHistory: newHistory
            };
        });
    }, []);
    
    return {
        formState,
        setField,
        setErrors,
        navigateTo,
        goBack
    };
} 