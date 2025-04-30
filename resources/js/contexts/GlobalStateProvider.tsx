import { Head } from '@inertiajs/react';
import { useState, createContext, useContext, useMemo } from 'react';
import { type Block, type Page as OfferPage, type OfferConfiguration, } from '@/types/offer';
import { cn } from '@/lib/utils';

import { BlockConfig, FieldState, HookUsage } from '@/types/blocks';
import { BlockContext } from '@/contexts/Numi';

import { blockTypes } from '@/components/blocks';
import axios from '@/lib/axios';
import { CheckoutSession } from '@/types/checkout';
import { handleNavigationLogic } from './NavigationProvider';
// Form and validation context
type ValidationErrors = Record<string, string[]>;
// Contexts
export const GlobalStateContext = createContext<GlobalState | null>(null);
export interface GlobalState {
  fieldStates: Record<string, FieldState>; // key is `${blockId}:${fieldName}`
  updateFieldState: (blockId: string, fieldName: string, value: any) => void;
  getFieldState: (blockId: string, fieldName: string) => FieldState | undefined;
  registerHook: (block: BlockConfig, hook: HookUsage) => void;
  hookUsage: Record<string, HookUsage[]>;


  // Form functionality
  errors: ValidationErrors;
  setErrors: (errors: ValidationErrors) => void;
  clearErrors: () => void;
  submitError: string | null;
  setSubmitError: (error: string | null) => void;
  isSubmitting: boolean;
  setSubmitting: (submitting: boolean) => void;

  // Validation
  // validatePage: (pageId: string) => boolean;
  validateField: (fieldId: string) => boolean;

  // Submission
  submitPage: (pageId: string) => Promise<boolean>;
  setPageSubmissionProps: (callback: () => Promise<unknown>) => void;
}

export function GlobalStateProvider({ offer, session: defaultSession, children }: { offer: OfferConfiguration, session: CheckoutSession, children: React.ReactNode }) {
  // Field states for all blocks
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [hookUsage, setHookUsage] = useState<Record<string, HookUsage[]>>({});
  const [registeredHooks, setRegisteredHooks] = useState<Set<string>>(new Set());
  const [session, setSession] = useState<CheckoutSession>(defaultSession);
  const [submissionProps, setSubmissionProps] = useState<() => Promise<unknown>>();
  // Form state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState<boolean>(false);


  // Update field state function
  const updateFieldState = (blockId: string, fieldName: string, value: any) => {
    setFieldStates(prev => ({
      ...prev,
      [`${blockId}:${fieldName}`]: {
        blockId,
        fieldName,
        value,
        type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
      }
    }));
  };

  // Get field state function
  const getFieldState = (blockId: string, fieldName: string) => {
    return fieldStates[`${blockId}:${fieldName}`];
  };

  // Register hook function
  const registerHook = (block: BlockConfig, hook: HookUsage) => {
    const hookKey = `${block.id}:${hook.name}`;
    // console.log('registerHook', hookKey, block, hook);
    if (!registeredHooks.has(hookKey)) {
      setRegisteredHooks(prev => new Set([...prev, hookKey]));
      setHookUsage(prev => {
        const newPrev = {...prev};

        if (prev[block.id] && !(prev[block.id] instanceof Array)) {
          newPrev[block.id] = []
        }
      window.newPrev = newPrev[block.id];

        console.log('🥕', block, prev, hook, newPrev[block.id])

        return {
          ...prev,
          [block.id]: [...(newPrev[block.id] || []), hook]
        }
      });
    }
  };

  // Clear errors function
  const clearErrors = () => {
    setErrors({});
  };



  // Validation functions
  const validateField = (fieldId: string): boolean => {
    const field = Object.values(fieldStates).find(state => state.blockId === fieldId);

    if (!field) return true; // If field doesn't exist, consider it valid

    // Get the block configuration for validation rules
    const page = offer.view.pages[currentPageId];
    const allBlocks: Block[] = [];

    // Helper to collect all blocks from a page
    const collectBlocks = (blocks: Block[] = []) => {
      blocks.forEach(block => {
        allBlocks.push(block);
        if (block.children) {
          collectBlocks(block.children);
        }
      });
    };

    // Collect blocks from all sections
    const pageView = page.view;

    // Find the block for this field
    const block = allBlocks.find(b => b.id === fieldId);

    if (!block) return true; // Block not found, consider valid

    // Check validation rules
    const value = field.value;
    const newErrors: ValidationErrors = {};

    // Required validation
    if (block.validation?.isRequired && (value === undefined || value === null || value === '')) {
      const label = block.content?.label || field.fieldName;
      newErrors[fieldId] = [`${label} is required`];
    }

    // Pattern validation
    if (block.validation?.pattern && value) {
      const regex = new RegExp(block.validation.pattern);
      if (!regex.test(String(value))) {
        newErrors[fieldId] = [block.validation.patternMessage || 'Invalid format'];
      }
    }

    // Min/Max length validation
    if (block.validation?.minLength && typeof value === 'string' && value.length < block.validation.minLength) {
      newErrors[fieldId] = [`Must be at least ${block.validation.minLength} characters`];
    }

    if (block.validation?.maxLength && typeof value === 'string' && value.length > block.validation.maxLength) {
      newErrors[fieldId] = [`Must be no more than ${block.validation.maxLength} characters`];
    }

    // Update errors for this field
    if (Object.keys(newErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...newErrors }));
      return false;
    }

    // Clear errors for this field if it was previously invalid
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }

    return true;
  };



  // Helper to get field value by ID
  const getFieldValue = (fieldId: string): any => {
    const state = Object.values(fieldStates).find(state => state.blockId === fieldId);
    return state?.value;
  };

  const setPageSubmissionProps = (callback: () => Promise<unknown>) => {
    setSubmissionProps(() => callback);
  };

  const submitPage = async (pageId: string): Promise<boolean> => {
    try {
      console.log('submitPage', pageId)
      setSubmitting(true);
      setSubmitError(null);

      // Determine the action based on the page type
      const currentPage = offer.view.pages[pageId];
      const action = currentPage.type === 'payment' ? 'commit' : 'setFields';
      const nextPageId = handleNavigationLogic(currentPage, (field) => {
        return fieldStates[field]?.value;
      });

      let params: Record<string, any> = {
        action,
        metadata: {
          fields: fieldStates,
          current_page_id: nextPageId,
        }
      }

      if(action === 'commit') {
        const body = (await submissionProps?.() ?? {}) as { error?: string, confirmation_token?: string };
        if(body.error) {
          setSubmitError(body.error);
          return false;
        }

        params.confirmation_token = body.confirmation_token;
      }

      // Use Axios instead of fetch
      const response = await axios.post(`/checkouts/${session.id}/mutations`, params);

      if (response.status !== 200) {
        setSubmitError(response.data?.message || 'Failed to commit checkout');
        return false;
      }
      return true;
    } catch (error) {
      console.error('submitPage error', error);
      if (axios.isAxiosError(error)) {
        setSubmitError(error.response?.data?.message || 'Failed to submit page');
      } else {
        setSubmitError('An unexpected error occurred');
      }
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const backendValidateFields = async (fields: Record<string, any>) => {
    // Call API to validate fields
    try {
      const response = await axios.post('/api/validate', fields);
      return response.data.errors || {};
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return error.response?.data?.errors || {};
      }
      return {};
    }
  };

  // Create context value
  const value: GlobalState = {
    // Original GlobalState properties
    fieldStates,
    updateFieldState,
    getFieldState,
    registerHook,
    hookUsage,

    // Form
    errors,
    setErrors,
    clearErrors,
    submitError,
    setSubmitError,
    isSubmitting,
    setSubmitting,
    submitPage,
    setPageSubmissionProps,
    // Validation
    // validatePage,
    validateField,

    // Submission
    // submitPage,
    // submit
    offer,
    session,
    setSession
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// Hook to use the enhanced global state
export const useCheckoutState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    // throw new Error('useCheckoutState must be used within a GlobalStateProvider');
  }
  return context ?? {};
};