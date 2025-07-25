import { Head } from '@inertiajs/react';
import { useState, createContext, useContext, useMemo, useEffect, useRef } from 'react';
import { type Block, type Page as OfferPage, type OfferConfiguration, OfferItem, Page, } from '@/types/offer';
import { cn } from '@/lib/utils';

import { BlockConfig, FieldState, HookUsage } from '@/types/blocks';

import { blockTypes } from '@/components/blocks';
import axios from '@/lib/axios';
import { CheckoutSession } from '@/types/checkout';
import { BlockRenderer } from '@/components/checkout/block-renderer';
import { SetItemActionValue } from '@/components/actions/set-item-action';
import { Theme } from '@/types/theme';
import { sendMessage } from '@/utils/sendMessage';
import { CheckoutSuccess } from '@/events/CheckoutSuccess';
import { CheckoutResized } from '@/events/CheckoutResized';
import { updateSessionLineItems } from '@/utils/editor-session';
import { isEvaluatedVisible } from '@/lib/blocks';
// Form and validation context

type FormData = Record<string, any>;
type ValidationErrors = Record<string, string[]>;

// Contexts
export const GlobalStateContext = createContext<GlobalState | null>(null);
export interface GlobalState {
  fields: Record<string, FieldState>;
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

  // Line Items
  updateLineItem: (offerItemId: string, price: string) => Promise<void>;
  addDiscount: (discount: string) => Promise<boolean>;
  removeDiscount: (discount: string) => Promise<boolean>;

  // Checkout
  updateSessionProperties: (blockId: string, value: any) => Promise<void>;

  offer: OfferConfiguration;
  theme: Theme;
  isEditor: boolean;
}

export function GlobalStateProvider({ offer, offerItems, session: defaultSession, editor = false, children }: { offer: OfferConfiguration, offerItems?: OfferItem[], session: CheckoutSession, editor?: boolean, children: React.ReactNode }) {
  // Field states for all blocks
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>(defaultSession.properties || {});

  const [hookUsage, setHookUsage] = useState<Record<string, HookUsage[]>>({});
  const [registeredHooks, setRegisteredHooks] = useState<Set<string>>(new Set());
  const [session, setSession] = useState<CheckoutSession>(defaultSession);
  const [submissionProps, setSubmissionProps] = useState<() => Promise<unknown>>();
  // Form state
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  const previousItemsRef = useRef<OfferItem[]|undefined>(undefined);

  const fields = useMemo(() => {
    return Object.values(fieldStates)
      .filter(field => field.fieldName === 'value')
      .reduce((acc, field) => {
        acc[field.blockId] = field;
        return acc;
      }, {} as Record<string, FieldState>);
  }, [fieldStates]);

  const updatedItems = useMemo(() => {
    // Find which items were updated
    const updatedItems = offerItems?.filter((item) => {
      const prevItem = previousItemsRef.current?.find(p => p.id === item.id);
      return prevItem && (
        prevItem.is_required !== item.is_required ||
        prevItem.is_highlighted !== item.is_highlighted ||
        // prevItem.is_tax_inclusive !== item.is_tax_inclusive ||
        // prevItem.tax_rate !== item.tax_rate ||
        prevItem.default_price_id !== item.default_price_id ||
        prevItem.prices.some(p => !item.prices.some(p2 => p2.name === p.name))
      );
    });

    previousItemsRef.current = offerItems;

    return updatedItems;
  }, [offerItems]);

  useEffect(() => {
    if(updatedItems && updatedItems.length > 0) {
      updatedItems.forEach(item => {
        updateLineItem({
          item: item.id,
          price: item.prices.find(p => p.id == item.default_price_id)?.lookup_key ?? undefined,
          quantity: 1,
          required: item.is_required
        });
      });
    }
  }, [updatedItems]);

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
    // basic key value instead of all block stuff
    // setFieldStates(prev => ({
    //   ...prev,
    //   [`${blockId}:${fieldName}`]: {
    //     value: value,
    //   }
    // }));

    // setFieldStates(prev => ({
    //   ...prev,
    //   [`${blockId}:${fieldName}`]: {
    //     blockId,
    //     fieldName,
    //     value,
    //     type: typeof value === 'boolean' ? 'boolean' : typeof value === 'number' ? 'number' : 'string'
    //   }
    // }));
  };

  // Get field state function
  const getFieldState = (blockId: string, fieldName: string) => {
    return fieldStates[`${blockId}:${fieldName}`];
  };

  // Register hook function
  const registerHook = (block: BlockConfig, hook: HookUsage) => {
    const hookKey = `${block.id}:${hook.name}`;

    setHookUsage(prev => {
      const newPrev = { ...prev };

      // Initialize as array if not already an array
      if (!newPrev[block.id] || !(newPrev[block.id] instanceof Array)) {
        newPrev[block.id] = [];
      }

      // Check if this specific hook already exists
      const existingHookIndex = newPrev[block.id].findIndex(
        (existingHook: HookUsage) => existingHook.name === hook.name
      );

      if (existingHookIndex >= 0) {
        // Update existing hook
        newPrev[block.id][existingHookIndex] = hook;
      } else {
        // Add new hook and register it
        if (!registeredHooks.has(hookKey)) {
          setRegisteredHooks(prev => new Set([...prev, hookKey]));
          newPrev[block.id].push(hook);
        }
      }

      return newPrev;
    });
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

  const setPageSubmissionProps = (callback: () => Promise<unknown>) => {
    setSubmissionProps(() => callback);
  };


  const updateSessionProperties = async (blockId: string, value: any) => {
    // Update local state immediately
    const newProperties = {
      ...session.properties,
      [blockId]: value
    };

    setSession(prev => ({
      ...prev,
      properties: newProperties
    }));

    if (editor) return;

    try {
      const response = await axios.post(`/checkouts/${session.id}/mutations`, {
        action: 'setProperties',
        properties: JSON.stringify({
          [blockId]: value
        })
      });
      return response.data;
    } catch (error) {
      console.error('Failed to update properties:', error);
    }
  };

  const submitPage = async (pageId: string): Promise<boolean> => {
    try {
      setSubmitting(true);
      setSubmitError(null);

      // Determine the action based on the page type
      const currentPage = offer.view.pages[pageId];
      const action = currentPage.type === 'payment' ? 'commit' : 'setFields';
      const nextPageId = handleNavigationLogic(currentPage, fields);
      console.log('submitPage', { pageId, action, nextPageId });

      let params: Record<string, any> = {
        action,
        metadata: {
          fields: fieldStates,
          current_page_id: nextPageId,
          page_history: [...offer.view.page_history ?? [], pageId],
        }
      }

      if (action === 'commit') {
        const body = (await submissionProps?.() ?? {}) as { error?: string, confirmation_token?: string };

        console.log('action-submit', { body });

        if (body.type && body.type === 'intercept') {
          console.log("INTERCEPTING SUBMISSION");
          setSubmitError(body.error);
          return false;
        }

        if (body.error) {
          setSubmitError(body.error);
          return false;
        }

        params = { ...params, ...body };
      }

      // Use Axios instead of fetch
      const response = await axios.post(`/checkouts/${session.id}/mutations`, params);

      if (response.status !== 200) {
        setSubmitError(response.data?.message || 'Failed to commit checkout');
        return false;
      }

      if (action === 'commit' && response.data?.checkout_session) {
        sendMessage(new CheckoutSuccess(response.data.checkout_session));
      }

      if (!nextPageId) {
        // Check for redirect_url in URL params
        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = urlParams.get('redirect_url');
        // TODO: append the checkout session token to the redirect url
        if (redirectUrl) {
          window.location.href = redirectUrl;
          return true;
        }
      }

      setSubmitting(false);

      return true;
    } catch (error) {

      console.error('checkout-main@submitPage error:', error);

      if (axios.isAxiosError(error)) {
        setSubmitError(error.response?.data?.message || 'Failed to submit page');
      } else {
        setSubmitError('An unexpected error occurred');
      }
      setSubmitting(false);

      return false;
    } finally {
      console.log("FINALLY BRUH");
    }
  };

  const updateLineItem = async ({ item, price, quantity, required }: SetItemActionValue) => {
    if (editor) {
      setSession(updateSessionLineItems({ offerItems, item, price, quantity, required, checkoutSession: session }));
      return;
    }

    const response = await axios.post(`/checkouts/${session.id}/mutations`, {
      action: 'setItem',
      offer_item_id: item,
      price_id: price ?? undefined,
      quantity: quantity ?? undefined,
      required: required ?? undefined
    });


    if (response.status === 200) {
      // sendMessage(new CheckoutResized());
      setSession(response.data);
    }

    return response.data;
  };

  const addDiscount = async (discount: string) => {
    const status = {
      success: true,
      message: 'Discount added successfully',
    }

    try {
      const response = await axios.post(`/checkouts/${session.id}/mutations`, {
        action: 'addDiscount',
        discount: discount
      });

      if (response.status === 200) {
        setSession(response.data);
        return status;
      }

      status.message = response.data?.message || 'Failed to add discount';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        status.message = error.response?.data?.message || 'Failed to add discount';
      } else {
        status.message = 'An unexpected error occurred';
      }
    }

    status.success = false;
    return status;
  }

  const removeDiscount = async (discount: string) => {
    const status = {
      success: true,
      message: 'Discount removed successfully',
    }

    try {
      const response = await axios.post(`/checkouts/${session.id}/mutations`, {
        action: 'removeDiscount',
        discount: discount
      });

      if (response.status === 200) {
        setSession(response.data);
        return status;
      }

      status.message = response.data?.message || 'Failed to remove discount';
    } catch (error) {
      if (axios.isAxiosError(error)) {
        status.message = error.response?.data?.message || 'Failed to remove discount';
      } else {
        status.message = 'An unexpected error occurred';
      }
    }

    return status;
  }

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
    fields,
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
    updateSessionProperties,
    validateField,
    updateLineItem,
    addDiscount,
    removeDiscount,

    // Submission
    // submitPage,
    // submit
    offer,
    theme: offer?.theme ?? {} as Theme,
    session,
    setSession,

    isEditor: editor
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

// Render a section of blocks - shows the block structure without actual rendering
export const Section = ({
  blocks,
  children
}: {
  blocks: Block[],
  children?: React.ReactNode
}) => {
  if(blocks.length === 0 && children != undefined) return children;
  return (
    blocks.map(block => (
      <BlockRenderer key={block.id} block={block}>
        {(blockContext) => {
          const Component = blockTypes[block.type as keyof typeof blockTypes];
          return Component ? <Component context={blockContext} /> : (
            <div className="text-xs text-purple-500 font-bold"><pre>UNFINISHED: {block.type}</pre></div>
          );
        }}
      </BlockRenderer>
    ))
  );
};

export const layoutConfig = {
  "name": "SplitCheckout@v1.1",
  "template": {
    "type": "grid",
    "props": {
      "className": "grid grid-cols-1 md:grid-cols-2 w-full h-full min-h-[inherit] max-h-[inherit]"
    },
    "children": [
      {
        "type": "box",
        "props": {
          "className": "h-full min-h-[inherit] max-h-[inherit] overflow-y-auto"
        },
        "children": [
          {
            "type": "flex",
            "props": {
              "className": "flex flex-col h-full"
            },
            "children": [
              {
                "type": "flex",
                "props": {
                  "className": "flex flex-col flex-grow overflow-y-auto"
                },
                "children": [
                  {
                    "id": "title",
                    "type": "NavigationBar",
                    "props": {
                      "className": "space-y-1 p-6",
                      "barStyle": "default"
                    }
                  },
                  {
                    "id": "content",
                    "type": "flex",
                    "props": {
                      "className": "flex flex-col flex-grow space-y-2 p-6"
                    }
                  }
                ]
              },
              {
                "id": "action",
                "type": "box",
                "props": {
                  "className": "p-6 flex flex-col"
                },
              }
            ]
          }
        ]
      },
      {
        "type": "box",
        "id": "promo_box",
        "props": {
          "className": "hidden md:flex h-full overflow-y-auto flex-col  min-h-[inherit] max-h-[inherit]"
        },
        "children": [
          {
            "id": "promo_header",
            "type": "box",
            "props": {
              "className": "h-auto p-6"
            }
          },
          {
            "id": "promo_content",
            "type": "box",
            "props": {
              "className": "h-full flex flex-col flex-grow space-y-2 p-6 min-h-max"
            }
          }
        ]
      }
    ]
  }
}


export type CheckoutState = {

  session: CheckoutSession;
  currentPageId: string;
  pageHistory: string[];
  completedPages: string[];
  formData: FormData;
  step: number;
  totalSteps: number;
  loading: boolean;
  error: string | null;

  // fields?
  isEditor: boolean;
  updateSessionProperties: (blockId: string, value: any) => Promise<void>;

  addItem: (item: Omit<Item, 'id'>) => Promise<void>;
  removeItem: (id: string) => void;
  clear: () => void;
  total: () => number;
};

// Navigation Types
interface NavigationHistoryEntry {
  pageId: string;
  timestamp: number;
  direction: 'forward' | 'backward';
  pageType: PageType;
}

interface NavigationState {
  currentPageId: string;
  pageHistory: string[];
  completedPages: string[];
  navigationHistory: NavigationHistoryEntry[];
}

interface NavigationContextType {
  // State
  currentPage: Page;
  currentPageId: string;
  pageHistory: string[];
  completedPages: string[];
  navigationHistory: NavigationHistoryEntry[];

  // Navigation Methods
  goToPage: (pageId: string) => void;
  goToNextPage: (fieldErrors: Record<string, string[]>) => Promise<void>;
  goToPrevPage: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}

export const NavigationContext = createContext<NavigationContextType | null>(null);

// Navigation logic
export const handleNavigationLogic = (page: Page, fields: Record<string, FieldState>): string | null => {
  // Get branches
  const branches = page.next_page.branches || [];

  if (branches.length > 0) {
    // Find first matching branch
    const matchingBranch = branches.find(branch => {
      return isEvaluatedVisible({ fields }, { conditional: branch.condition });
    });

    if (matchingBranch && matchingBranch.next_page) {
      return matchingBranch.next_page;
    }
  }

  // Default next page
  return page.next_page.default_next_page || null;
};

interface NavigationProviderProps {
  children: React.ReactNode;
  onPageChange?: (pageId: string, name: string) => void;
}

export const NavigationProvider = ({ children, onPageChange }: NavigationProviderProps) => {
  const { offer } = useCheckoutState();
  const { fieldStates, fields } = useCheckoutState();

  const pages = useMemo(() => {
    return offer.view.pages;
  }, [offer]);

  const [currentPageId, setCurrentPageId] = useState(offer.view.first_page);
  const [pageHistory, setPageHistory] = useState<string[]>(offer.view.page_history || []);
  const [completedPages, setCompletedPages] = useState<string[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([]);

  const currentPage = useMemo(() => {
    return pages[currentPageId];
  }, [currentPageId, pages]);

  const canNavigateToNextPage = (fieldErrors: Record<string, string[]>) => {
    return Object.values(fieldErrors).every((error) => !error);
  };

  const canGoBack = () => {
    if (!currentPage) return false;
    // Can't go back from entry pages
    if (currentPage?.type === 'entry') return false;
    // Can go back if we have history
    return pageHistory.length > 0;
  };

  const canGoForward = () => {
    // Can't go forward from ending pages
    if (currentPage.type === 'ending') return false;

    const nextPage = handleNavigationLogic(currentPage, fields);
    return !!nextPage;
  };

  const addToNavigationHistory = (pageId: string, direction: 'forward' | 'backward', pageType: PageType) => {
    setNavigationHistory(prev => [...prev, {
      pageId,
      timestamp: Date.now(),
      direction,
      pageType
    }]);
  };

  const submitPageFields = async (pageId: string, fields: Record<string, any>) => {
    try {
      // todo!
      const response = await fetch(`/api/checkout/pages/${pageId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit page fields');
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting page fields:', error);
      throw error;
    }
  };

  const goToPrevPage = () => {
    if (canGoBack()) {
      const previousPage = pageHistory[pageHistory.length - 1];
      setCurrentPageId(previousPage);
      onPageChange?.(previousPage, pages[previousPage].name);
      setPageHistory(prev => prev.slice(0, -1));
      addToNavigationHistory(previousPage, 'backward', pages[previousPage].type);
    }
  };

  const goToPage = (pageId: string) => {
    const nextPage = pages[pageId];

    // Update navigation state
    setPageHistory(prev => [...prev, currentPageId]);

    if (!completedPages.includes(currentPageId)) {
      setCompletedPages(prev => [...prev, currentPageId]);
    }

    addToNavigationHistory(pageId, 'forward', nextPage.type);
    setCurrentPageId(pageId);
    onPageChange?.(pageId, nextPage.name);
  };

  const goToNextPage = async (fieldErrors: Record<string, string[]>) => {
    if (!canNavigateToNextPage(fieldErrors)) {
      return;
    }

    const nextPageId = handleNavigationLogic(currentPage, fields);

    if (!nextPageId) {
      return;
    }

    goToPage(nextPageId);
  };

  const value: NavigationContextType = {
    currentPage,
    goToPage,
    goToNextPage,
    goToPrevPage,
    currentPageId,
    pageHistory,
    completedPages,
    canGoBack,
    canGoForward,
    navigationHistory
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// Update the useNavigation hook to handle null context
export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const useValidateFields = () => {
  const { fieldStates, setFieldError } = useCheckoutState()

  const validateField = (name, value) => {
    if (!value) {
      // setFieldError(name, `${name} is required`)
    } else {
      // setFieldError(name, null)  // Clear error if valid
    }
  }



  function validateAllFields() {
    const fields = Object.entries(fieldStates).reduce((acc, [key, state]) => {
      acc[key] = state.value;
      return acc;
    }, {} as Record<string, any>);

    console.log('validateAllFields', { fieldStates, fields })
    // Validate each field
    Object.keys(fields).forEach((field) => {
      const fieldState = fields[field];
      if (!fieldState) return;
      const value = fieldState.value
      validateField(field, value)
    })

    return new Promise(async (resolve, reject) => {
      // Optionally: Trigger backend validation here
      // const errors = await backendValidateFields(field)
      // Object.keys(errors).forEach((field) => {
      // setFieldError(field, errors[field])
      // })

      resolve({})
    })
  }

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

  return { validateAllFields }
}

const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex flex-col items-end">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mb-2 px-3 py-1 bg-gray-800 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
        >
          {isOpen ? 'Hide Debug' : 'Show Debug'}
        </button>

        {isOpen && (
          <div className="w-96 max-h-[50vh] overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 text-xs">
            <StateDisplay />
          </div>
        )}
      </div>
    </div>
  );
};

function StateDisplay() {
  const globalState = useContext(GlobalStateContext);
  const { pageHistory, completedPages, canGoBack, canGoForward, navigationHistory } = useNavigation();
  if (!globalState) return null;

  return (
    <div className="p-1 bg-gray-100 rounded">
      <table className="whitespace-pre-wrap">
        <thead>
          <tr className="text-xs text-left">
            <th className="px-1 overflow-hidden">Field</th>
            <th className="px-1">Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(globalState.fieldStates).map(([key, field]) => (
            <tr key={key}>
              <td className="px-1">{key}</td>
              <td className="px-1">{JSON.stringify(field.value, null, 2)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="px-1">Page History</td>
            <td className="px-1">{pageHistory.join(', ')}</td>
          </tr>
          <tr>
            <td className="px-1">Completed Pages</td>
            <td className="px-1">{completedPages.join(', ')}</td>
          </tr>
          <tr>
            <td className="px-1">Navigation History</td>
            <td className="px-1">
              <div className="space-y-1">
                {navigationHistory.map((entry: NavigationHistoryEntry, index: number) => (
                  <div key={index} className="text-xs">
                    {new Date(entry.timestamp).toLocaleTimeString()} - {entry.direction}: {entry.pageId}
                  </div>
                ))}
              </div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}


export function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
        <h1 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h1>
        <p className="text-gray-700">The checkout flow is not properly configured. Please contact support.</p>
      </div>
    </div>
  )
}

export function LoadingError({ error }: { error: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
        <h1 className="text-xl font-bold text-red-600 mb-4">Error Loading Checkout</h1>
        <p className="text-gray-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 w-full bg-primary text-white py-2 px-4 rounded hover:bg-primary/90"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
