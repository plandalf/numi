import { Head } from '@inertiajs/react';
import { useState, createContext, useContext, useMemo } from 'react';
import { type Block, type Page as OfferPage, type OfferConfiguration, } from '@/types/offer';
import { cn } from '@/lib/utils';

import { BlockConfig, FieldState, HookUsage } from '@/types/blocks';
import { BlockContext } from '@/contexts/Numi';

import { blockTypes } from '@/components/blocks';
import axios from '@/lib/axios';
import { CheckoutSession } from '@/types/checkout';
// Form and validation context
type FormData = Record<string, any>;
type ValidationErrors = Record<string, string[]>;
interface BlockContextType {
  blockId: string;
}

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

// Stubbed out BlockRenderer component that doesn't render anything
// Block Renderer
function BlockRenderer({ block, children }: {
  block: BlockConfig,
  children: (props: BlockContextType) => React.ReactNode
}) {
  const globalStateContext = useContext(GlobalStateContext);
  if (!globalStateContext) {
    throw new Error('BlockRenderer must be used within a GlobalStateProvider');
  }

  const blockContext: BlockContextType = {
    blockId: block.id,
    blockConfig: block,
    globalState: globalStateContext,
    registerField: (fieldName, defaultValue) => {
      if (!globalStateContext.getFieldState(block.id, fieldName)) {
        globalStateContext.updateFieldState(block.id, fieldName, defaultValue);
      }
    },
    getFieldValue: (fieldName) => {
      return globalStateContext.getFieldState(block.id, fieldName)?.value;
    },
    setFieldValue: (fieldName, value) => {
      globalStateContext.updateFieldState(block.id, fieldName, value);
    },
    registerHook: (hook: HookUsage) => {
      globalStateContext.registerHook(block, hook);
    }
  };

  return (
    <BlockContext.Provider value={blockContext}>
      {children(blockContext)}
    </BlockContext.Provider>
  );
}

// Render a section of blocks - shows the block structure without actual rendering
const Section = ({ blocks, className }: { blocks: Block[], className?: string }) => {
    if (!blocks || blocks.length === 0) return null;

    console.log('blocks', blocks)
    return (
        <div className={cn("space-y-2 ", className)}>
            {/*<div className="text-sm font-medium bg-gray-100">Section with {blocks.length} block(s)</div>*/}
            {blocks.map(block => (
              <BlockRenderer key={block.id} block={block}>
                  {(blockContext) => {
                  const Component = blockTypes[block.type as keyof typeof blockTypes];
                  return Component ? <Component context={blockContext} /> : (
                    <div className="text-xs text-purple-500 font-bold"><pre>UNFINISHED: {block.type}</pre></div>
                  );
              }}
              </BlockRenderer>
            ))}
        </div>
    );
};

interface NavigationBarProps extends React.HTMLAttributes<HTMLDivElement> {
  barStyle?: string;
  children?: React.ReactNode;
  className?: string;
}

const NavigationBar = ({ barStyle, children, className, ...props }: NavigationBarProps) => {
  const { goToPrevPage, canGoBack, canGoForward } = useNavigation();

  function onBack() {
    goToPrevPage();
  }

  return (
    <div className={`${className} flex items-center justify-between`} {...props}>
      {canGoBack() && (
        <button
          onClick={onBack}
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Back
        </button>
      )}
      <h1 className="text-xl font-bold">Checkout</h1>
      {children}
    </div>
  );
};


interface TailwindLayoutConfig {
  name?: string;
  template: {
    type: string;
    props?: Record<string, any>;
    children?: Array<any>;
    id?: string;
  };
}

interface TailwindLayoutRendererProps {
  layoutConfig: TailwindLayoutConfig | string;
  contentMap?: Record<string, React.ReactNode>;
  page: Page;
  components?: Record<string, React.ComponentType<any>>;
}

const TailwindLayoutRenderer = ({
  layoutConfig,
  page,
  components = {}
}: TailwindLayoutRendererProps) => {
  // Use the config directly if it's an object, otherwise parse it
  const config = typeof layoutConfig === 'string'
    ? JSON.parse(layoutConfig)
    : layoutConfig;

  // Set up component registry
  const componentRegistry = {
    // Default components
    NavigationBar: (props: NavigationBarProps) => (
      <div className={`nav-bar ${props.barStyle || ''} ${props.className || ''}`}>
        {props.children}
      </div>
    ),
    // Custom components from props
    ...components
  };

  // Render the template
  return renderElement(config.template, page, { componentRegistry, contentMap: {} });
};

// Helper function to render an element based on its type and props
const renderElement = (
  element: {
    type: string;
    props?: ComponentProps;
    children?: Array<any>;
    id?: string;
  } | null,
  page: Page,
  context: {
    componentRegistry: ComponentRegistry;
    contentMap: Record<string, React.ReactNode>;
  }
): React.ReactNode => {
  // Return null for undefined or null elements
  if (!element) return null;

  const { type, props = {}, children = [], id } = element;
  const { componentRegistry, contentMap } = context;

  // If this element has an ID, check if it matches a section in the page view
  if (id && page.view[id]) {
    const section = page.view[id];
    if (section && section.blocks) {
      // Render the section with its blocks
      return createElement(
        type,
        { ...props, id },
        <Section blocks={section.blocks} className={props.className} />,
        componentRegistry
      );
    }
  }

  // Render child elements recursively
  const childElements = Array.isArray(children)
    ? children.map((child, index) => renderElement(
        child,
        page,
        context
      ))
    : null;

  // Return the appropriate React element based on type
  return createElement(type, { ...props, key: id || `${type}` }, childElements, componentRegistry);
};

type ComponentProps = React.HTMLAttributes<HTMLElement> & {
  className?: string;
  [key: string]: any;
};
type ComponentRegistry = {
  [key: string]: React.ComponentType<any>;
};

// Create the appropriate element based on type
const createElement = (
  type: string,
  props: ComponentProps,
  children: React.ReactNode,
  componentRegistry: ComponentRegistry
) => {
  // If we have a custom component registered for this type, use it
  if (componentRegistry[type]) {
    const Component = componentRegistry[type];
    return <Component {...props}>{children}</Component>;
  }

  // Use a div
  return <div {...props}>{children}</div>;
};

const layoutConfig = {
  "name": "SplitCheckout@v1.1",
  "template": {
    "type": "grid",
    "props": {
      "className": "grid grid-cols-1 md:grid-cols-2 h-screen w-full"
    },
    "children": [
      {
        "type": "box",
        "props": {
          "className": "overflow-hidden"
        },
        "children": [
          {
            "type": "flex",
            "props": {
              "className": "flex flex-col justify-between h-full"
            },
            "children": [
              {
                "type": "flex",
                "props": {
                  "className": "flex flex-col flex-grow space-y-6 px-10 py-8 overflow-y-auto"
                },
                "children": [
                  {
                    "id": "title",
                    "type": "NavigationBar",
                    "props": {
                      "className": "px-6 space-y-1",
                      "barStyle": "default"
                    }
                  },
                  {
                    "id": "content",
                    "type": "flex",
                    "props": {
                      "className": "flex flex-col flex-grow space-y-2"
                    }
                  }
                ]
              },
              {
                "id": "action",
                "type": "box",
                "props": {
                  "className": "p-6 bg-white shadow-top"
                },
                "children": [
                  {
                    "type": "flex",
                    "props": {
                      "className": "flex flex-col space-y-2"
                    }
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "id": "promo",
        "type": "box",
        "props": {
          "className": "hidden md:block bg-blue-50 h-full overflow-y-auto"
        }
      }
    ]
  }
}

// diff between a checkout "state" ?Submission
  // state of progress through the checkout

// and the checkout model

// and the fields

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

  addItem: (item: Omit<Item, 'id'>) => Promise<void>;
  removeItem: (id: string) => void;
  clear: () => void;
  total: () => number;
};

// Page Types
type PageType = 'page' | 'entry' | 'payment' | 'ending';

interface Page extends OfferPage {
  type: PageType;
}

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
  goToNextPage: (fieldErrors: Record<string, string[]>) => Promise<void>;
  goToPrevPage: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

// Navigation logic
const handleNavigationLogic = (page: Page, getFieldValue: (field: string) => any): string | null => {
  // Get branches
  const branches = page.next_page.branches || [];

  if (branches.length > 0) {
    // Find first matching branch
    const matchingBranch = branches.find(branch => {
      if (!branch.condition) {
        return true; // Default branch
      }

      const { field, operator, value } = branch.condition;
      const fieldValue = getFieldValue(field);

      // Compare based on operator
      switch (operator) {
        case 'eq':
          return fieldValue === value;
        case 'ne':
          return fieldValue !== value;
        case 'gt':
          return Number(fieldValue) > Number(value);
        case 'lt':
          return Number(fieldValue) < Number(value);
        case 'gte':
          return Number(fieldValue) >= Number(value);
        case 'lte':
          return Number(fieldValue) <= Number(value);
        case 'contains':
          return String(fieldValue).includes(String(value));
        case 'not_contains':
          return !String(fieldValue).includes(String(value));
        default:
          return false;
      }
    });

    if (matchingBranch && matchingBranch.next_page) {
      return matchingBranch.next_page;
    }
  }

  // Default next page
  return page.next_page.default_next_page || null;
};

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const { offer } = useCheckoutState();
  const { fieldStates } = useCheckoutState();

  const pages = useMemo(() => {
    return offer.view.pages;
  }, [offer]);

  const [currentPageId, setCurrentPageId] = useState(offer.view.first_page);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [completedPages, setCompletedPages] = useState<string[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<NavigationHistoryEntry[]>([]);

  const currentPage = useMemo(() => {
    return pages[currentPageId];
  }, [currentPageId, pages]);

  const canNavigateToNextPage = (fieldErrors: Record<string, string[]>) => {
    return Object.values(fieldErrors).every((error) => !error);
  };

  const canGoBack = () => {
    // Can't go back from entry pages
    if (currentPage.type === 'entry') return false;
    // Can go back if we have history
    return pageHistory.length > 0;
  };

  const canGoForward = () => {
    // Can't go forward from ending pages
    if (currentPage.type === 'ending') return false;

    const nextPage = handleNavigationLogic(currentPage, (field) => {
      return fieldStates[field]?.value;
    });
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
      setPageHistory(prev => prev.slice(0, -1));
      addToNavigationHistory(previousPage, 'backward', pages[previousPage].type);
    }
  };

  const goToNextPage = async (fieldErrors: Record<string, string[]>) => {
    if (!canNavigateToNextPage(fieldErrors)) {
      return;
    }

    const nextPageId = handleNavigationLogic(currentPage, (field) => {
      return fieldStates[field]?.value;
    });

    if (!nextPageId) {
      return;
    }

    const nextPage = pages[nextPageId];

    // Update navigation state
    setPageHistory(prev => [...prev, currentPageId]);

    if (!completedPages.includes(currentPageId)) {
      setCompletedPages(prev => [...prev, currentPageId]);
    }

    addToNavigationHistory(nextPageId, 'forward', nextPage.type);
    setCurrentPageId(nextPageId);
  };

  const value: NavigationContextType = {
    currentPage,
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



  function validateAllFields () {
    const fields = Object.entries(fieldStates).reduce((acc, [key, state]) => {
      acc[key] = state.value;
      return acc;
    }, {} as Record<string, any>);

    console.log('validateAllFields', { fieldStates, fields })
    // Validate each field
    Object.keys(fields).forEach((field) => {
      const value = fields[field].value
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

// checkout context?
// Replace CheckoutLayout with CheckoutPage component
const CheckoutController = ({ offer }: { offer: OfferConfiguration }) => {
  const {
    isSubmitting,
    submitError,
    clearErrors,
    setSubmitting,
    setSubmitError,
    submitPage,
  } = useCheckoutState();

  const { validateAllFields } = useValidateFields();
  const { currentPage, goToNextPage } = useNavigation();

  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    clearErrors();
    setSubmitError(null);

    try {
      setSubmitting(true);
      const errors = await validateAllFields();

      if (Object.keys(errors).length > 0) {
        setSubmitError('Please fix the errors before continuing');
        return;
      }

      // Submit the current page
      const success = await submitPage(currentPage.id);
      if (!success) {
        return; // Stop if submission failed
      }

      // If all successful, proceed to next page
      await goToNextPage(errors);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentPage) {
    console.error('No page found');
    return null;
  }

  return (
    <>
      {/* Fixed error toast */}
      {submitError && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-md shadow-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  type="button"
                  className="inline-flex text-red-400 hover:text-red-500"
                  onClick={() => setSubmitError(null)}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="relative">
        <TailwindLayoutRenderer
          layoutConfig={layoutConfig}
          page={currentPage}
          components={{ NavigationBar }}
        />
      </form>
    </>
  );
};




// Update main Checkout component to use FormProvider and CheckoutProvider
interface Props {
  offer: OfferConfiguration;
  error?: string | null;
  embedDomain?: string;
  environment?: string;
  checkoutSession: CheckoutSession;
}

export default function Checkout({ offer, error, environment = 'live', checkoutSession }: Props) {

  if (error) {
    return <LoadingError error={error}/>;
  }

  const firstPage = offer.view.pages[offer.view.first_page];

  if (!firstPage) {
    return <PageNotFound/>;
  }

  console.log('checkoutSession', checkoutSession)
  return (
    <>
      <Head title={`Checkout: ${offer.name}`} />

      {/* global state, checkout */}
      <GlobalStateProvider offer={offer} session={checkoutSession}>
        <NavigationProvider>
          <div className="min-h-screen bg-gray-50">
            {error ? (
              <div className="p-4">
                <div className="bg-red-50 text-red-900 p-4 rounded-md">
                  {error}
                </div>
              </div>
            ) : (
              <>
                <CheckoutController offer={offer} />
                <DebugPanel />
              </>
            )}

          </div>
        </NavigationProvider>
      </GlobalStateProvider>
    </>
  );
}

// Add this component before the CheckoutLayout component
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


function PageNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h1 className="text-xl font-bold text-red-600 mb-4">Configuration Error</h1>
          <p className="text-gray-700">The checkout flow is not properly configured. Please contact support.</p>
        </div>
      </div>
  )
}

function LoadingError({ error }: { error: string }) {
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
