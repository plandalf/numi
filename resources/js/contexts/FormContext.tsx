import React, { createContext, useContext, useReducer, useCallback } from 'react';

interface FormContextType {
    formState: {
        values: Record<string, any>;
        errors: Record<string, string>;
        touched: Record<string, boolean>;
    };
    setFieldValue: (name: string, value: any) => void;
    setFieldError: (name: string, error: string) => void;
    setFieldTouched: (name: string, touched: boolean) => void;
    validateField: (name: string) => void;
    validateForm: () => boolean;
    resetForm: () => void;
}

const initialState = {
    values: {},
    errors: {},
    touched: {},
};

const formReducer = (state: typeof initialState, action: any) => {
    switch (action.type) {
        case 'SET_FIELD_VALUE':
            return {
                ...state,
                values: {
                    ...state.values,
                    [action.name]: action.value,
                },
            };
        case 'SET_FIELD_ERROR':
            return {
                ...state,
                errors: {
                    ...state.errors,
                    [action.name]: action.error,
                },
            };
        case 'SET_FIELD_TOUCHED':
            return {
                ...state,
                touched: {
                    ...state.touched,
                    [action.name]: action.touched,
                },
            };
        case 'RESET_FORM':
            return initialState;
        default:
            return state;
    }
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [formState, dispatch] = useReducer(formReducer, initialState);

    const setFieldValue = useCallback((name: string, value: any) => {
        dispatch({ type: 'SET_FIELD_VALUE', name, value });
    }, []);

    const setFieldError = useCallback((name: string, error: string) => {
        dispatch({ type: 'SET_FIELD_ERROR', name, error });
    }, []);

    const setFieldTouched = useCallback((name: string, touched: boolean) => {
        dispatch({ type: 'SET_FIELD_TOUCHED', name, touched });
    }, []);

    const validateField = useCallback((name: string) => {
        // Add validation logic here
    }, []);

    const validateForm = useCallback(() => {
        // Add form validation logic here
        return true;
    }, []);

    const resetForm = useCallback(() => {
        dispatch({ type: 'RESET_FORM' });
    }, []);

    const value = {
        formState,
        setFieldValue,
        setFieldError,
        setFieldTouched,
        validateField,
        validateForm,
        resetForm,
    };

    return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
};

export const useCheckoutForm = () => {
    const context = useContext(FormContext);
    if (!context) {
        throw new Error('useCheckoutForm must be used within a FormProvider');
    }
    return context;
}; 