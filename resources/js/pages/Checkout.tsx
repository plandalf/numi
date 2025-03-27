import { Head } from '@inertiajs/react';
import { useEffect, useState, createContext, useContext, useCallback, useReducer, useMemo } from 'react';
import { type Block, type PageView, type Page, type PageType } from '@/types/offer';
import { cn } from '@/lib/utils';
import { FormField, Branch } from '@/types/offer';

// Form and validation context
type FormData = Record<string, any>;
type ValidationErrors = Record<string, string[]>;

interface FormState {
  data: FormData;
  errors: ValidationErrors;
  isDirty: boolean;
  submitting: boolean;
  currentPageId: string;
  pageHistory: string[];
}

type FormAction = 
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'SET_ERRORS'; errors: ValidationErrors }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_SUBMITTING'; submitting: boolean }
  | { type: 'NAVIGATE'; pageId: string; addToHistory?: boolean }
  | { type: 'GO_BACK' }
  | { type: 'RESET_FORM'; data?: FormData };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        isDirty: true,
        data: {
          ...state.data,
          [action.field]: action.value
        }
      };
    case 'SET_ERRORS':
      return {
        ...state,
        errors: action.errors
      };
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {}
      };
    case 'SET_SUBMITTING':
      return {
        ...state,
        submitting: action.submitting
      };
    case 'NAVIGATE':
      return {
        ...state,
        currentPageId: action.pageId,
        pageHistory: action.addToHistory 
          ? [...state.pageHistory, state.currentPageId]
          : state.pageHistory
      };
    case 'GO_BACK':
      const previousPage = state.pageHistory[state.pageHistory.length - 1] || state.currentPageId;
      return {
        ...state,
        currentPageId: previousPage,
        pageHistory: state.pageHistory.slice(0, -1)
      };
    case 'RESET_FORM':
      return {
        ...state,
        isDirty: false,
        data: action.data || {},
        errors: {},
        submitting: false
      };
    default:
      return state;
  }
};

// Update the FormContext to include checkout monitoring state
interface FormContextType {
  formState: FormState;
  setField: (field: string, value: any) => void;
  setErrors: (errors: ValidationErrors) => void;
  clearErrors: () => void;
  submitForm: () => Promise<boolean>;
  navigateTo: (pageId: string) => void;
  goBack: () => void;
  resetForm: (data?: FormData) => void;
  currentCheckoutState: () => CheckoutState;
}

// Add a checkout state type for monitoring
interface CheckoutState {
  currentPageId: string;
  pageHistory: string[];
  completedPages: string[];
  formData: FormData;
  step: number;
  totalSteps: number;
}

// Create a context for form state
const FormContext = createContext<FormContextType | undefined>(undefined);

// Context provider for handling form state
interface FormProviderProps {
  offer: OfferConfiguration;
  children: React.ReactNode;
}

const FormProvider: React.FC<FormProviderProps> = ({ offer, children }) => {
  const initialState: FormState = {
    data: {},
    errors: {},
    isDirty: false,
    submitting: false,
    currentPageId: offer.view.first_page,
    pageHistory: []
  };

  const [formState, dispatch] = useReducer(formReducer, initialState);
  const [completedPages, setCompletedPages] = useState<string[]>([]);

  // Calculate total steps in the flow
  const totalSteps = useMemo(() => {
    // Count all pages in the main flow starting from first_page
    let count = 0;
    let visited = new Set<string>();
    let currentId = offer.view.first_page;
    
    while (currentId && offer.view.pages[currentId] && !visited.has(currentId)) {
      count++;
      visited.add(currentId);
      
      const page = offer.view.pages[currentId];
      const nextPageId = page.next_page.default_next_page;
      currentId = nextPageId || '';
      
      if (!nextPageId) break;
    }
    
    return count;
  }, [offer.view]);
  
  // Calculate current step number
  const currentStep = useMemo(() => {
    const pageOrder = new Map<string, number>();
    let visited = new Set<string>();
    let currentId = offer.view.first_page;
    let step = 0;
    
    while (currentId && offer.view.pages[currentId] && !visited.has(currentId)) {
      step++;
      pageOrder.set(currentId, step);
      visited.add(currentId);
      
      const page = offer.view.pages[currentId];
      const nextPageId = page.next_page.default_next_page;
      currentId = nextPageId || '';
      
      if (!nextPageId) break;
    }
    
    return pageOrder.get(formState.currentPageId) || 1;
  }, [offer.view, formState.currentPageId]);

  // Actions
  const setField = (field: string, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
  };

  const setErrors = (errors: ValidationErrors) => {
    dispatch({ type: 'SET_ERRORS', errors });
  };

  const clearErrors = () => {
    dispatch({ type: 'CLEAR_ERRORS' });
  };

  const navigateTo = (pageId: string) => {
    // Add current page to completed pages
    if (!completedPages.includes(formState.currentPageId)) {
      setCompletedPages([...completedPages, formState.currentPageId]);
    }
    
    dispatch({ type: 'NAVIGATE', pageId, addToHistory: true });
  };

  const goBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  const resetForm = (data?: FormData) => {
    dispatch({ type: 'RESET_FORM', data });
    setCompletedPages([]);
  };

  // Get current checkout state for monitoring
  const currentCheckoutState = useCallback((): CheckoutState => {
    return {
      currentPageId: formState.currentPageId,
      pageHistory: formState.pageHistory,
      completedPages,
      formData: formState.data,
      step: currentStep,
      totalSteps
    };
  }, [formState, completedPages, currentStep, totalSteps]);

  // Form submission
  const submitForm = async (): Promise<boolean> => {
    clearErrors();
    dispatch({ type: 'SET_SUBMITTING', submitting: true });
    
    try {
      // Get current page data
      const currentPage = offer.view.pages[formState.currentPageId];
      
      // Process form based on page type
      let result = false;
      
      switch (currentPage.type) {
        case 'entry':
          result = await processEntryPage(currentPage as unknown as PageItem);
          break;
        case 'page':
          result = await processContentPage(currentPage as unknown as PageItem);
          break;
        case 'ending':
          result = await processEndingPage(currentPage as unknown as PageItem);
          break;
        default:
          console.error(`Unknown page type: ${currentPage.type}`);
          result = false;
      }
      
      dispatch({ type: 'SET_SUBMITTING', submitting: false });
      return result;
    } catch (error: any) {
      console.error('Form submission error:', error);
      
      setErrors({ form: [typeof error === 'string' ? error : 'An unexpected error occurred'] });
      
      dispatch({ type: 'SET_SUBMITTING', submitting: false });
      return false;
    }
  };

  // Process different page types
  const processEntryPage = async (page: PageItem): Promise<boolean> => {
    // Entry pages typically collect initial data
    
    // Validate form data if needed
    if (!validateForm(page)) {
      return false;
    }
    
    try {
      // For entry pages, we just need to validate and navigate
      console.log('Processing entry page:', page.id);
      
      // Mark this page as completed
      if (!completedPages.includes(page.id)) {
        setCompletedPages([...completedPages, page.id]);
      }
      
      // Handle navigation based on page branches
      handleNavigation(page);
      return true;
    } catch (error: any) {
      console.error('Entry page processing error:', error);
      return false;
    }
  };

  const processContentPage = async (page: PageItem): Promise<boolean> => {
    // Content pages collect additional information
    
    // Validate form data
    if (!validateForm(page)) {
      return false;
    }
    
    try {
      // For content pages, we just need to validate and navigate
      console.log('Processing content page:', page.id, 'with data:', formState.data);
      
      // Handle navigation based on page branches
      handleNavigation(page);
      return true;
    } catch (error: any) {
      console.error('Content page processing error:', error);
      return false;
    }
  };

  const processEndingPage = async (page: PageItem): Promise<boolean> => {
    // Ending pages typically process payments or finalize orders
    
    // Validate form data
    if (!validateForm(page)) {
      return false;
    }
    
    try {
      // For ending pages in this implementation, we'll just show success
      console.log('Processing ending page:', page.id, 'with data:', formState.data);
      
      // In a real implementation, you would process payment here
      // For now, we'll just simulate success
      
      // For demo purposes, show a success alert
      alert('Order completed successfully!');
      
      // Reset the form after successful completion
      resetForm();
      
      // Navigate to the first page (simulating a new order)
      dispatch({ type: 'NAVIGATE', pageId: offer.view.first_page, addToHistory: false });
      
      return true;
    } catch (error: any) {
      console.error('Ending page processing error:', error);
      // Set an error that would normally come from the server
      setErrors({ form: ['There was an error processing your payment. Please try again.'] });
      return false;
    }
  };

  // Enhanced validation helper
  const validateForm = (page: PageItem): boolean => {
    const newErrors: Record<string, string[]> = {};
    let isValid = true;

    // Get form fields for current page
    const formFields = page.view.form?.fields || [];

    // Validate each form field
    formFields.forEach((field: FormField) => {
      const value = formState.data[field.name];
      const fieldErrors: string[] = [];
      
      // Required field validation
      if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        fieldErrors.push(`${field.label || field.name} is required`);
        isValid = false;
      }
      
      // Only validate non-empty fields for type-specific validations
      if (value && typeof value === 'string' && value.trim() !== '') {
        // Email validation
        if (field.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            fieldErrors.push(`Please enter a valid email address`);
            isValid = false;
          }
        }
        
        // Phone validation
        if (field.type === 'tel') {
          const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
          if (!phoneRegex.test(value)) {
            fieldErrors.push(`Please enter a valid phone number`);
            isValid = false;
          }
        }
        
        // Zip/postal code validation
        if (field.type === 'text' && field.validation === 'zip') {
          const zipRegex = /^[0-9]{5}(?:-[0-9]{4})?$/; // US format
          if (!zipRegex.test(value)) {
            fieldErrors.push(`Please enter a valid ZIP code`);
            isValid = false;
          }
        }
        
        // Credit card validation
        if (field.type === 'text' && field.validation === 'cc-number') {
          // Simple Luhn algorithm check + length check
          const ccRegex = /^[0-9]{13,19}$/;
          if (!ccRegex.test(value.replace(/\s/g, ''))) {
            fieldErrors.push(`Please enter a valid credit card number`);
            isValid = false;
          }
        }
        
        // Date validation (YYYY-MM-DD)
        if (field.type === 'date') {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(value)) {
            fieldErrors.push(`Please enter a valid date in YYYY-MM-DD format`);
            isValid = false;
          }
        }
        
        // Min/max length validation
        if (field.minLength && value.length < field.minLength) {
          fieldErrors.push(`${field.label || field.name} must be at least ${field.minLength} characters`);
          isValid = false;
        }
        if (field.maxLength && value.length > field.maxLength) {
          fieldErrors.push(`${field.label || field.name} must be no more than ${field.maxLength} characters`);
          isValid = false;
        }
        
        // Password complexity validation
        if (field.type === 'password' && field.validation === 'strong') {
          const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
          if (!strongPasswordRegex.test(value)) {
            fieldErrors.push(`Password must contain at least 8 characters, including uppercase, lowercase, number and special character`);
            isValid = false;
          }
        }
        
        // Custom pattern validation
        if (field.pattern) {
          try {
            const regex = new RegExp(field.pattern);
            if (!regex.test(value)) {
              fieldErrors.push(field.patternMessage || `${field.label || field.name} format is invalid`);
              isValid = false;
            }
          } catch (e) {
            console.error(`Invalid regex pattern for field ${field.name}:`, e);
          }
        }
      }
      
      // Add field errors if any
      if (fieldErrors.length > 0) {
        newErrors[field.name] = fieldErrors;
      }
    });

    // Check for matching fields (like password confirmation)
    formFields.forEach((field: FormField) => {
      if (field.matchWith && formState.data[field.name] !== formState.data[field.matchWith]) {
        if (!newErrors[field.name]) newErrors[field.name] = [];
        newErrors[field.name].push(`${field.label || field.name} must match ${field.matchWithLabel || field.matchWith}`);
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Navigation handler
  const handleNavigation = (page: PageItem) => {
    // Handle navigation based on page branches if any
    const branches = page.view.branches || [];
    
    if (branches.length > 0) {
      // Find the first matching branch or use the default
      const matchingBranch = branches.find((branch: Branch) => {
        if (!branch.condition) return true; // Default branch
        
        // Simple condition evaluation - could be expanded for more complex logic
        const [fieldName, operator, value] = branch.condition.split(' ');
        const fieldValue = formState.data[fieldName];
        
        switch (operator) {
          case '==': return fieldValue === value;
          case '!=': return fieldValue !== value;
          case '>': return Number(fieldValue) > Number(value);
          case '<': return Number(fieldValue) < Number(value);
          default: return false;
        }
      });
      
      if (matchingBranch && matchingBranch.next_page) {
        navigateTo(matchingBranch.next_page);
      }
    } else if (page.view.next_page) {
      // If no branches but has next_page defined
      navigateTo(page.view.next_page);
    } else if (page.next_page.default_next_page) {
      // If next_page is defined in the page object
      navigateTo(page.next_page.default_next_page);
    }
  };

  return (
    <FormContext.Provider value={{
      formState,
      setField,
      setErrors,
      clearErrors,
      submitForm,
      navigateTo,
      goBack,
      resetForm,
      currentCheckoutState
    }}>
      {children}
    </FormContext.Provider>
  );
};

// Hook to use the form context
const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
};

interface OfferConfiguration {
    id: string;
    view: {
        id: string;
        pages: Record<string, PageItem>;
        first_page: string;
    };
    client: string;
    variant?: string | null;
    variant_filters?: Record<string, any> | null;
}

// Create an interface to match the actual page structure we're using
interface PageItem {
    id: string;
    name: string;
    type: PageType;
    view: PageView;
    layout: { sm: string };
    position: { x: number; y: number };
    provides: string[];
    next_page: {
        branches: {
            next_page: string | null;
            condition: any;
        }[];
        default_next_page: string | null;
    };
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
    const p: Record<string, string> = {};

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

interface PageProps {
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

// Block renderer components
const TextBlock = ({ block }: { block: Block }) => {
    if (!block.text) return null;
    
    return block.text.map((content, i) => {
        if (content.object === 'text') {
            return (
                <span 
                    key={i}
                    className={cn(
                        content.annotations?.bold && "font-bold"
                    )}
                >
                    {content.props.content}
                </span>
            );
        }
        if (content.object === 'icon') {
            return (
                <span 
                    key={i}
                    className="inline-block w-4 h-4 align-middle"
                    style={content.style}
                >
                    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path d="M9 12l2 2 4-4" />
                    </svg>
                </span>
            );
        }
        return null;
    });
};

const DetailList = ({ block }: { block: Block }) => {
    if (!block.children) return null;
    
    return (
        <dl className={cn("space-y-4", block.style)}>
            {block.children.map((group, groupIdx) => {
                if (group.type !== 'dl-group' || !group.children) return null;
                
                const dtChild = group.children.find(child => child.type === 'dt');
                const ddChild = group.children.find(child => child.type === 'dd');
                
                // Extract content from dt
                let dtContent = '';
                if (dtChild?.text?.[0]?.props && 'content' in dtChild.text[0].props) {
                    dtContent = dtChild.text[0].props.content;
                }
                
                return (
                    <div key={groupIdx} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <dt className="font-semibold mb-1">
                            {dtContent}
                        </dt>
                        {ddChild?.children?.map((paragraph, paraIdx) => (
                            <dd key={paraIdx} className="text-gray-600">
                                {paragraph.text?.map((text, textIdx) => (
                                    <span key={textIdx}>
                                        {text.object === 'text' && text.props.content}
                                    </span>
                                ))}
                            </dd>
                        ))}
                    </div>
                );
            })}
        </dl>
    );
};

const ImageBlock = ({ block }: { block: Block }) => {
    if (!block.props?.src) return null;
    
    return (
        <figure className="w-full overflow-hidden">
            <img 
                src={block.props.src}
                alt={block.props.alt || ''}
                className="w-full h-auto object-cover rounded-md shadow-sm"
                loading="lazy"
            />
            {block.props.caption && (
                <figcaption className="mt-2 text-center text-sm text-gray-500 italic">
                    {block.props.caption}
                </figcaption>
            )}
        </figure>
    );
};

// Enhanced InputBlock component with better validation handling
const InputBlock = ({ block }: { block: Block }) => {
    const { formState, setField } = useForm();
    const fieldName = block.props?.name || block.id;
    const fieldValue = formState.data[fieldName] || '';
    const errors = formState.errors[fieldName] || [];
    
    if (!fieldName) return null;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        let value = e.target.value;
        
        // Format certain inputs automatically
        if (block.props?.type === 'tel' && block.props?.autoFormat) {
            // Format phone numbers as (xxx) xxx-xxxx
            value = value.replace(/\D/g, '');
            if (value.length > 0) {
                value = value.substring(0, 10);
                const parts = [
                    value.substring(0, 3),
                    value.substring(3, 6),
                    value.substring(6, 10)
                ].filter(Boolean);
                
                if (parts.length === 1) {
                    value = parts[0];
                } else if (parts.length === 2) {
                    value = `(${parts[0]}) ${parts[1]}`;
                } else if (parts.length === 3) {
                    value = `(${parts[0]}) ${parts[1]}-${parts[2]}`;
                }
            }
        }
        
        // Format credit card numbers with spaces
        if (block.props?.validation === 'cc-number' && block.props?.autoFormat) {
            value = value.replace(/\D/g, '');
            value = value.substring(0, 16);
            value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
        }
        
        setField(fieldName, value);
    };
    
    const handleBlur = () => {
        // Perform individual field validation on blur
        if (block.props?.validateOnBlur && fieldName) {
            const { setErrors } = useForm();
            const field: FormField = {
                name: fieldName,
                type: block.props?.type || 'text',
                label: block.props?.label,
                required: block.props?.required,
                validation: block.props?.validation,
                pattern: block.props?.pattern,
                patternMessage: block.props?.patternMessage,
                minLength: block.props?.minLength,
                maxLength: block.props?.maxLength,
                matchWith: block.props?.matchWith,
                matchWithLabel: block.props?.matchWithLabel
            };
            
            // Simulate validating just this field
            const fieldErrors: string[] = [];
            const value = formState.data[fieldName];
            
            // Required check
            if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
                fieldErrors.push(`${field.label || field.name} is required`);
            }
            
            // Type-specific validation for non-empty fields
            if (value && typeof value === 'string' && value.trim() !== '') {
                // Perform validation based on field type and validation rules
                if (field.type === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        fieldErrors.push(`Please enter a valid email address`);
                    }
                }
                
                // Add other validations as needed
                if (field.type === 'tel') {
                    const phoneRegex = /^\+?[0-9\s\-()]{8,20}$/;
                    if (!phoneRegex.test(value)) {
                        fieldErrors.push(`Please enter a valid phone number`);
                    }
                }
                
                // Custom pattern validation
                if (field.pattern) {
                    try {
                        const regex = new RegExp(field.pattern);
                        if (!regex.test(value)) {
                            fieldErrors.push(field.patternMessage || `${field.label || field.name} format is invalid`);
                        }
                    } catch (e) {
                        console.error(`Invalid regex pattern for field ${field.name}:`, e);
                    }
                }
            }
            
            // Set errors just for this field
            if (fieldErrors.length > 0) {
                const currentErrors = {...formState.errors};
                currentErrors[fieldName] = fieldErrors;
                setErrors(currentErrors);
            } else {
                // Clear errors for this field if previously had errors
                if (formState.errors[fieldName]) {
                    const currentErrors = {...formState.errors};
                    delete currentErrors[fieldName];
                    setErrors(currentErrors);
                }
            }
        }
    };
    
    const renderField = () => {
        const inputType = block.props?.type || 'text';
        const placeholder = block.props?.placeholder || '';
        const required = block.props?.required || false;
        const label = block.props?.label || '';
        const fieldOptions = block.props?.options || [];
        
        switch (inputType) {
            case 'text':
            case 'email':
            case 'tel':
            case 'number':
            case 'date':
            case 'password':
                return (
                    <div className="space-y-2">
                        {label && (
                            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700">
                                {label} {required && <span className="text-red-500">*</span>}
                            </label>
                        )}
                        <input
                            type={inputType}
                            id={fieldName}
                            name={fieldName}
                            value={fieldValue}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={placeholder}
                            required={required}
                            autoComplete={block.props?.autoComplete}
                            min={block.props?.min}
                            max={block.props?.max}
                            pattern={block.props?.htmlPattern}
                            className={cn(
                                "w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                                errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                        />
                        {errors.length > 0 && (
                            <div className="text-red-500 text-sm mt-1">
                                {errors.map((error, i) => (
                                    <div key={i}>{error}</div>
                                ))}
                            </div>
                        )}
                        {block.props?.helpText && (
                            <p className="text-sm text-gray-500 mt-1">{block.props.helpText}</p>
                        )}
                    </div>
                );
            case 'textarea':
                return (
                    <div className="space-y-2">
                        {label && (
                            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700">
                                {label} {required && <span className="text-red-500">*</span>}
                            </label>
                        )}
                        <textarea
                            id={fieldName}
                            name={fieldName}
                            value={fieldValue}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={placeholder}
                            required={required}
                            rows={block.props?.rows || 4}
                            className={cn(
                                "w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                                errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                        />
                        {errors.length > 0 && (
                            <div className="text-red-500 text-sm mt-1">
                                {errors.map((error, i) => (
                                    <div key={i}>{error}</div>
                                ))}
                            </div>
                        )}
                        {block.props?.helpText && (
                            <p className="text-sm text-gray-500 mt-1">{block.props.helpText}</p>
                        )}
                    </div>
                );
            case 'select':
                return (
                    <div className="space-y-2">
                        {label && (
                            <label htmlFor={fieldName} className="block text-sm font-medium text-gray-700">
                                {label} {required && <span className="text-red-500">*</span>}
                            </label>
                        )}
                        <select
                            id={fieldName}
                            name={fieldName}
                            value={fieldValue}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            required={required}
                            className={cn(
                                "w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                                errors.length > 0 && "border-red-500 focus:border-red-500 focus:ring-red-500"
                            )}
                        >
                            <option value="">{placeholder || 'Select an option'}</option>
                            {fieldOptions.map((option: { value: string; label: string }, i: number) => (
                                <option key={i} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {errors.length > 0 && (
                            <div className="text-red-500 text-sm mt-1">
                                {errors.map((error, i) => (
                                    <div key={i}>{error}</div>
                                ))}
                            </div>
                        )}
                        {block.props?.helpText && (
                            <p className="text-sm text-gray-500 mt-1">{block.props.helpText}</p>
                        )}
                    </div>
                );
            case 'radio':
            case 'checkbox':
                return (
                    <div className="space-y-3">
                        {label && (
                            <div className="block text-sm font-medium text-gray-700">
                                {label} {required && <span className="text-red-500">*</span>}
                            </div>
                        )}
                        <div className="space-y-2">
                            {fieldOptions.map((option: { value: string; label: string }, i: number) => (
                                <div key={i} className="flex items-center">
                                    <input
                                        type={inputType}
                                        id={`${fieldName}-${i}`}
                                        name={fieldName}
                                        value={option.value}
                                        checked={
                                            inputType === 'checkbox' 
                                                ? Array.isArray(fieldValue) && fieldValue.includes(option.value)
                                                : fieldValue === option.value
                                        }
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        required={required}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor={`${fieldName}-${i}`} className="ml-2 block text-sm text-gray-700">
                                        {option.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                        {errors.length > 0 && (
                            <div className="text-red-500 text-sm mt-1">
                                {errors.map((error, i) => (
                                    <div key={i}>{error}</div>
                                ))}
                            </div>
                        )}
                        {block.props?.helpText && (
                            <p className="text-sm text-gray-500 mt-1">{block.props.helpText}</p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="form-field mb-4">
            {renderField()}
        </div>
    );
};

const PaymentBlock = ({ block }: { block: Block }) => {
    const { formState, setField } = useForm();
    const [cardError, setCardError] = useState<string | null>(null);
    
    useEffect(() => {
        // In a real implementation, you would initialize a payment SDK here
        // (e.g., Stripe Elements or similar)
        console.log('Initializing payment form...');
        
        // Cleanup function
        return () => {
            console.log('Cleaning up payment form...');
        };
    }, []);
    
    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setField('cardNumber', e.target.value);
        
        // Simple validation for demo
        if (!/^\d{16}$/.test(e.target.value)) {
            setCardError('Card number must be 16 digits');
        } else {
            setCardError(null);
        }
    };
    
    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setField('expiryDate', e.target.value);
    };
    
    const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setField('cvc', e.target.value);
    };
    
    return (
        <div className="p-4 border border-gray-200 rounded-lg">
            <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                    <label htmlFor="card-number" className="text-sm font-medium text-gray-700">
                        Card number
                    </label>
                    <input
                        id="card-number"
                        type="text"
                        value={formState.data.cardNumber || ''}
                        onChange={handleCardChange}
                        placeholder="1234 5678 9012 3456"
                        className={cn(
                            "w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
                            cardError && "border-red-500"
                        )}
                    />
                    {cardError && (
                        <div className="text-red-500 text-sm">{cardError}</div>
                    )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col space-y-2">
                        <label htmlFor="expiry-date" className="text-sm font-medium text-gray-700">
                            Expiry date
                        </label>
                        <input
                            id="expiry-date"
                            type="text"
                            value={formState.data.expiryDate || ''}
                            onChange={handleExpiryChange}
                            placeholder="MM/YY"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                        <label htmlFor="cvc" className="text-sm font-medium text-gray-700">
                            CVC
                        </label>
                        <input
                            id="cvc"
                            type="text"
                            value={formState.data.cvc || ''}
                            onChange={handleCvcChange}
                            placeholder="123"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Update ButtonBlock to handle form submission and back navigation
const ButtonBlock = ({ block }: { block: Block }) => {
    const { formState, submitForm, goBack } = useForm();
    
    const handleClick = async () => {
        // Check if this is a submit button
        if (block.props?.action === 'submit') {
            await submitForm();
        } else if (block.props?.action === 'back') {
            // Go back to previous page
            goBack();
        }
    };
    
    return (
        <button 
            type={block.props?.action === 'submit' ? 'submit' : 'button'}
            onClick={handleClick}
            disabled={formState.submitting}
            className={cn(
                "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                block.props?.action === 'back' && "bg-gray-200 text-gray-800 hover:bg-gray-300",
                formState.submitting && "opacity-75 cursor-not-allowed"
            )}
            style={block.style}
        >
            {formState.submitting && block.props?.action === 'submit' ? (
                <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                </div>
            ) : (
                <TextBlock block={block} />
            )}
        </button>
    );
};

// Update BlockRenderer to handle the PlanDescriptor block
const BlockRenderer = ({ block }: { block: Block }) => {
    if (!block) return null;

    // Handle text-based blocks
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(block.type)) {
        const className = {
            h1: "text-4xl font-bold",
            h2: "text-3xl font-bold",
            h3: "text-2xl font-bold",
            h4: "text-xl font-bold",
            h5: "text-lg font-bold",
            h6: "text-base font-bold"
        }[block.type];

        switch (block.type) {
            case 'h1':
                return <h1 className={cn(className, block.style && Object.values(block.style).join(' '))}><TextBlock block={block} /></h1>;
            case 'h2':
                return <h2 className={cn(className, block.style && Object.values(block.style).join(' '))}><TextBlock block={block} /></h2>;
            case 'h3':
                return <h3 className={cn(className, block.style && Object.values(block.style).join(' '))}><TextBlock block={block} /></h3>;
            case 'h4':
                return <h4 className={cn(className, block.style && Object.values(block.style).join(' '))}><TextBlock block={block} /></h4>;
            case 'h5':
                return <h5 className={cn(className, block.style && Object.values(block.style).join(' '))}><TextBlock block={block} /></h5>;
            case 'h6':
                return <h6 className={cn(className, block.style && Object.values(block.style).join(' '))}><TextBlock block={block} /></h6>;
            default:
                return null;
        }
    }

    switch (block.type) {
        case 'p':
            return (
                <p className={cn("text-gray-700", block.style && Object.values(block.style).join(' '))}>
                    <TextBlock block={block} />
                </p>
            );
        case 'button':
            return <ButtonBlock block={block} />;
        case 'image':
            return <ImageBlock block={block} />;
        case 'dl':
            return <DetailList block={block} />;
        case 'input':
        case 'select':
        case 'textarea':
            return <InputBlock block={block} />;
        case 'StripeElements@v1':
            return <PaymentBlock block={block} />;
        case 'plan-descriptor':
            return <PlanDescriptor block={block} />;
        default:
            return (
                <div className="p-2 border border-gray-200 rounded text-sm text-gray-500">
                    {block.type}
                </div>
            );
    }
};

// Renders a section of blocks
const Section = ({ blocks, className }: { blocks: Block[], className?: string }) => {
    if (!blocks || blocks.length === 0) return null;

    return (
        <div className={cn("space-y-4", className)}>
            {blocks.map((block, index) => (
                <div key={block.id || index}>
                    <BlockRenderer block={block} />
                </div>
            ))}
        </div>
    );
};

// Order Summary Component for showing cart details
const OrderSummary = () => {
  const { offer } = useCheckoutContext();
  const { formState } = useForm();
  const variant = offer.variant || 'default';
  const variantData = offer.variant_filters || {};

  // Price information from variant data
  const price = variantData.price || '$99.99';
  const interval = variantData.interval || 'month';
  const setupFee = variantData.setupFee || null;
  const discount = formState.data.discountCode ? '$10.00' : null;

  // Calculate totals
  const subtotal = price;
  const tax = '$0.00'; // In a real implementation, tax would be calculated
  const total = setupFee ? setupFee : price; // Simplified calculation

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
      
      <div className="space-y-3 mb-6">
        {/* Product/Plan Name */}
        <div className="flex justify-between">
          <span>{variantData.name || variant}</span>
          <span>{price}</span>
        </div>
        
        {/* Billing interval */}
        <div className="text-sm text-gray-500">
          Billed {interval}ly
        </div>
        
        {/* Setup fee if applicable */}
        {setupFee && (
          <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
            <span>Setup fee</span>
            <span>{setupFee}</span>
          </div>
        )}
        
        {/* Discount if applicable */}
        {discount && (
          <div className="flex justify-between text-green-600 mt-2 pt-2 border-t border-gray-200">
            <span>Discount</span>
            <span>-{discount}</span>
          </div>
        )}
        
        {/* Tax */}
        <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
          <span>Tax</span>
          <span>{tax}</span>
        </div>
      </div>
      
      {/* Total */}
      <div className="flex justify-between font-bold text-lg pt-4 border-t-2 border-gray-300">
        <span>Total Due Today</span>
        <span>{total}</span>
      </div>
      
      {/* Payment schedule info if trial */}
      {variantData.trialDays && (
        <div className="mt-4 text-sm text-gray-600">
          <p>Your first payment of {price} will be charged after {variantData.trialDays} days.</p>
        </div>
      )}
      
      {/* Security badge */}
      <div className="mt-6 flex items-center justify-center text-gray-500 text-sm">
        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        Secure checkout
      </div>
    </div>
  );
};

// Add a PromoCodeInput component for discount codes
const PromoCodeInput = () => {
  const { formState, setField } = useForm();
  const [promoApplied, setPromoApplied] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  
  const applyPromoCode = () => {
    const code = formState.data.promoCode;
    if (!code) {
      setPromoError('Please enter a promo code');
      return;
    }
    
    setIsValidating(true);
    
    // Simulate API call to validate promo code
    setTimeout(() => {
      if (code.toUpperCase() === 'DISCOUNT10') {
        setPromoApplied(true);
        setPromoError(null);
        setField('discountCode', code);
        setField('discountAmount', 10);
      } else {
        setPromoError('Invalid promo code');
        setPromoApplied(false);
        setField('promoCode', '');
        setField('discountCode', '');
        setField('discountAmount', 0);
      }
      setIsValidating(false);
    }, 800);
  };
  
  const removePromoCode = () => {
    setPromoApplied(false);
    setPromoError(null);
    setField('promoCode', '');
    setField('discountCode', '');
    setField('discountAmount', 0);
  };
  
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium">Have a promo code?</h4>
      </div>
      
      {promoApplied ? (
        <div className="flex items-center justify-between bg-green-50 p-2 rounded">
          <div className="flex items-center">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold mr-2">
              {formState.data.promoCode}
            </span>
            <span className="text-green-700 text-sm">
              $10 discount applied!
            </span>
          </div>
          <button 
            type="button"
            onClick={removePromoCode}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Remove
          </button>
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={formState.data.promoCode || ''}
            onChange={(e) => {
              setField('promoCode', e.target.value);
              if (promoError) setPromoError(null);
            }}
            placeholder="Enter code"
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm"
          />
          <button
            type="button"
            onClick={applyPromoCode}
            disabled={isValidating}
            className={cn(
              "bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm",
              isValidating ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-300"
            )}
          >
            {isValidating ? 'Checking...' : 'Apply'}
          </button>
        </div>
      )}
      
      {promoError && (
        <p className="text-red-500 text-xs mt-1">{promoError}</p>
      )}
    </div>
  );
};

// Update the CheckoutLayout to include OrderSummary for payment pages
const CheckoutLayout = ({ page, offer }: { page: PageView; offer: OfferConfiguration }) => {
    const { formState, submitForm, currentCheckoutState, goBack } = useForm();
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitForm();
    };
    
    // Get checkout state for progress indicator
    const checkoutState = currentCheckoutState();
    
    // Check if there's a global form error
    const formError = formState.errors.form ? formState.errors.form[0] : null;
    
    // Check if current page is a payment page
    const isPaymentPage = page.content?.blocks.some(block => 
        block.type === 'StripeElements@v1' || 
        block.props?.isPayment
    );
    
    return (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
            {/* Form error message - shown if there's a global error */}
            {formError && (
                <div className="fixed top-4 inset-x-0 mx-auto max-w-md z-50">
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center justify-between">
                        <span>{formError}</span>
                        <button type="button" className="text-red-700" onClick={() => {}}>
                            <span className="text-2xl">&times;</span>
                        </button>
                    </div>
                </div>
            )}
            
            {/* Progress indicator for multi-step checkout */}
            <div className="fixed top-0 left-0 w-full h-2 bg-gray-200 z-50">
                <div 
                    className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
                    style={{ 
                        width: `${(checkoutState.step / checkoutState.totalSteps) * 100}%`
                    }}
                />
            </div>
            
            {/* Left column */}
            <div className="bg-white overflow-hidden">
                <div className="flex flex-col justify-center h-full">
                    <div className="flex flex-col space-y-6 overflow-y-auto px-6 md:px-10 py-8 grow">
                        {/* Step indicator */}
                        <div className="text-sm text-gray-500 mt-4">
                            Step {checkoutState.step} of {checkoutState.totalSteps}
                        </div>
                        
                        {/* Title section */}
                        {page.title && (
                            <div className="pt-2">
                                <Section blocks={page.title.blocks} />
                            </div>
                        )}
                        
                        {/* Content section */}
                        {page.content && (
                            <div className="grow">
                                <Section blocks={page.content.blocks} />
                            </div>
                        )}
                        
                        {/* Promo code input for payment pages */}
                        {isPaymentPage && <PromoCodeInput />}
                    </div>
                    
                    {/* Action section */}
                    {page.action && (
                        <div className="p-6 border-t border-gray-100">
                            <Section blocks={page.action.blocks} />
                            
                            {/* Add default submit button if there's no explicit one in the blocks */}
                            {!page.action.blocks.some(block => 
                                block.type === 'button' && block.props?.action === 'submit'
                            ) && (
                                <div className="flex justify-between items-center mt-4">
                                    {checkoutState.step > 1 && (
                                        <button
                                            type="button"
                                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                            onClick={goBack}
                                        >
                                            Back
                                        </button>
                                    )}
                                    <button
                                        type="submit"
                                        className={cn(
                                            "px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                                            checkoutState.step === 1 ? "w-full" : "ml-auto"
                                        )}
                                        disabled={formState.submitting}
                                    >
                                        {formState.submitting ? 'Processing...' : (
                                            checkoutState.step === checkoutState.totalSteps ? 'Complete Order' : 'Continue'
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            {/* Right column - Either Promo or Order Summary based on page type */}
            <div className="bg-gray-50 overflow-y-auto h-full p-6 md:p-10">
                {isPaymentPage ? (
                    <OrderSummary />
                ) : (
                    page.promo && <Section blocks={page.promo.blocks} className="h-full" />
                )}
            </div>
        </form>
    );
};

// Update main Checkout component to use FormProvider and CheckoutProvider
export default function Checkout({
    offer,
    error,
    agentToken,
    collectorId,
    environment,
    embedDomain,
    variant,
}: PageProps) {
    const [isLoaded, setIsLoaded] = useState(false);

    // Set loaded state on component mount
    useEffect(() => {
        setIsLoaded(true);
    }, []);

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

    if (!offer || !isLoaded) {
        return (
            <>
                <Head title="Loading..." />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
            </>
        );
    }

    // Get current page from the offer
    const currentPageId = offer.view.first_page;
    const currentPage = offer.view.pages[currentPageId];
    
    return (
        <>
            <Head title={currentPage.name || "Checkout"} />
            <FormProvider offer={offer}>
                <CheckoutProvider offer={offer}>
                    <PageNavigator offer={offer} />
                </CheckoutProvider>
            </FormProvider>
        </>
    );
}

// Create a component to handle page navigation
const PageNavigator = ({ offer }: { offer: OfferConfiguration }) => {
    const { formState } = useForm();
    const currentPageId = formState.currentPageId;
    const currentPage = offer.view.pages[currentPageId];
    
    if (!currentPage) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl text-gray-600">Page not found</div>
            </div>
        );
    }
    
    return <CheckoutLayout page={currentPage.view} offer={offer} />;
};

// Create a checkout context to pass offer data
interface CheckoutContextType {
  offer: OfferConfiguration;
  currentStep: number;
  totalSteps: number;
  completedSteps: string[];
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

const useCheckoutContext = () => {
  const context = useContext(CheckoutContext);
  if (!context) {
    throw new Error('useCheckoutContext must be used within a CheckoutProvider');
  }
  return context;
};

const CheckoutProvider: React.FC<{ offer: OfferConfiguration; children: React.ReactNode }> = ({ 
  offer, 
  children 
}) => {
  const { currentCheckoutState } = useForm();
  const checkoutState = currentCheckoutState();
  
  const value: CheckoutContextType = {
    offer,
    currentStep: checkoutState.step,
    totalSteps: checkoutState.totalSteps,
    completedSteps: checkoutState.completedPages
  };
  
  return (
    <CheckoutContext.Provider value={value}>
      {children}
    </CheckoutContext.Provider>
  );
};

// Update the PlanDescriptor component to use CheckoutContext
const PlanDescriptor = ({ block }: { block: Block }) => {
  const { offer } = useCheckoutContext();
  
  // Extract variant information from the block or use the one from the offer
  const variant = block.props?.variant || offer.variant || 'default';
  const variantData = block.props?.variantData || offer.variant_filters || {};
  
  // Default pricing information - in real implementation would come from the offer
  const price = variantData.price || block.props?.price || '$99.99';
  const interval = variantData.interval || block.props?.interval || 'month';
  const setupFee = variantData.setupFee || block.props?.setupFee;
  const trialDays = variantData.trialDays || block.props?.trialDays;
  
  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {block.props?.title || 'Plan Details'}
        </h3>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Plan name */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Plan</span>
          <span className="font-medium">{variantData.name || block.props?.name || variant}</span>
        </div>
        
        {/* Billing cycle */}
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Billing Cycle</span>
          <span className="font-medium">{`${price}/${interval}`}</span>
        </div>
        
        {/* Setup fee if applicable */}
        {setupFee && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Setup Fee</span>
            <span className="font-medium">{setupFee}</span>
          </div>
        )}
        
        {/* Trial period if applicable */}
        {trialDays && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Free Trial</span>
            <span className="font-medium">{trialDays} days</span>
          </div>
        )}
        
        {/* Features list */}
        {block.props?.features && Array.isArray(block.props.features) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-md font-medium mb-2">Includes:</h4>
            <ul className="space-y-2">
              {block.props.features.map((feature: string, index: number) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Order summary */}
      {block.props?.showSummary && (
        <div className="bg-gray-50 p-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Due Today</span>
            <span className="text-lg font-bold">{setupFee ? `${setupFee}` : (trialDays ? '$0.00' : price)}</span>
          </div>
          {trialDays && (
            <p className="text-sm text-gray-500 mt-1">
              Your first payment of {price} will be charged after {trialDays} days.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
