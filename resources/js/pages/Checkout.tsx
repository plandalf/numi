import { Head } from '@inertiajs/react';
import { useEffect, useState, createContext, useContext, useCallback, useReducer, useMemo } from 'react';
import { type Block, type Page, type PageType, type OfferConfiguration, type OfferVariant, Branch, PageView } from '@/types/offer';
import { cn, formatMoney } from '@/lib/utils';
import update from 'immutability-helper';
import { BlockConfig, FieldState } from '@/types/blocks';
import TextBlockComponent from '@/components/blocks/TextBlock';
import { BlockContext } from '@/contexts/Numi';
import CheckboxBlockComponent from '@/components/blocks/CheckboxBlock';
import TextInputBlockComponent from '@/components/blocks/TextInputBlock';
import DetailListBlockComponent from '@/components/blocks/DetailListComponent';
import ButtonBlockComponent from '@/components/blocks/ButtonBlock';
import QuoteBlockComponent from '@/components/blocks/QuoteBlock';
import OptionSelectorComponent from '@/components/blocks/OptionSelectorBlock';
import CheckoutSummaryComponent from '@/components/blocks/CheckoutSummaryBlock';
// Form and validation context
type FormData = Record<string, any>;
type ValidationErrors = Record<string, string[]>;

interface FormState {
  data: FormData;
  errors: ValidationErrors;
  isDirty: boolean;
  submitting: boolean;
  // currentPageId: string;
  pageHistory: string[];
}

// Add placeholder type definition for BlockContextType
interface BlockContextType {
  blockId: string;
  // Add other properties as needed
}

// Example block with the new structure
const exampleBlocks: Block[] = [
  {
    id: 'text-block-1',
    type: 'text',
    object: 'block',
    content: {
      value: 'This is a sample text block',
      label: 'Text Block'
    },
    interaction: {
      isDisabled: false,
    },
    appearance: {
      fontSize: '16px',
      fontWeight: 'bold',
      textColor: '#333333',
    },
    validation: {
      isRequired: true,
    }
  },
  {
    id: 'checkbox-block-1',
    type: 'checkbox',
    object: 'field',
    content: {
      label: 'Checkbox Block',
      is_default_checked: false,
    }
  },
  {
    id: '789',
    type: 'text_input',
    object: 'block',
    content: {  
      default_value: 'Block Text',
      label: 'First Name',
    }
  },
];



// Contexts
const GlobalStateContext = createContext<GlobalState | null>(null);

// Enhanced GlobalState interface to include checkout functionality
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
  
  // Validation
  // validatePage: (pageId: string) => boolean;
  validateField: (fieldId: string) => boolean;
  
  // Submission
  isSubmitting: boolean;
  setSubmitting: (submitting: boolean) => void;
  submitPage: (pageId: string) => Promise<boolean>;
}

function GlobalStateProvider({ offer, children }: { offer: OfferConfiguration, children: React.ReactNode }) {
  // Field states for all blocks
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const [hookUsage, setHookUsage] = useState<Record<string, HookUsage[]>>({});
  const [registeredHooks, setRegisteredHooks] = useState<Set<string>>(new Set());
  

  // Form state
  const [errors, setErrors] = useState<ValidationErrors>({});
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
    if (!registeredHooks.has(hookKey)) {
      setRegisteredHooks(prev => new Set([...prev, hookKey]));
      setHookUsage(prev => ({
        ...prev,
        [block.id]: [...(prev[block.id] || []), hook]
      }));
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
    // collectBlocks(pageView?.content?.blocks || []);
    // collectBlocks(pageView?.promo?.blocks || []);
    // collectBlocks(pageView?.title?.blocks || []);
    // collectBlocks(pageView?.action?.blocks || []);
    
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
  
  // Create context value
  const value: EnhancedGlobalState = {
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
    
    // Validation
    // validatePage,
    validateField,
    
    // Submission
    isSubmitting,
    setSubmitting,
    // submitPage,
    // submit 
    offer,
  };

  return (
    <GlobalStateContext.Provider value={value}>
      {children}
    </GlobalStateContext.Provider>
  );
}

// Hook to use the enhanced global state
const useCheckoutState = () => {
  const context = useContext(GlobalStateContext);
  if (!context) {
    throw new Error('useCheckoutState must be used within a GlobalStateProvider');
  }
  return context as EnhancedGlobalState;
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
    registerHook: (hook) => {
      globalStateContext.registerHook(block, hook);
    }
  };

  return (
    <BlockContext.Provider value={blockContext}>
      {children(blockContext)}
    </BlockContext.Provider>
  );
}

const blockTypes = {
  text: TextBlockComponent,
  checkbox: CheckboxBlockComponent,
  text_input: TextInputBlockComponent,
  detail_list: DetailListBlockComponent,
  button: ButtonBlockComponent,
  quote: QuoteBlockComponent,
  option_selector: OptionSelectorComponent, 
  checkout_summary: CheckoutSummaryComponent,
}

// Render a section of blocks - shows the block structure without actual rendering
const Section = ({ blocks, className }: { blocks: Block[], className?: string }) => {
    if (!blocks || blocks.length === 0) return null;

    console.log('blocks', blocks)
    return (
        <div className={cn("space-y-2 ", className)}>
            <div className="text-sm font-medium bg-gray-100">Section with {blocks.length} block(s)</div>
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

const NavigationBar = ({ barStyle, children, className, ...props }: NavigationBarProps) => (
  <div className={`${className} flex items-center justify-between`} {...props}>
    <h1 className="text-xl font-bold">Checkout</h1>
    {children}
  </div>
);


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
  return <div {...props} style={{ outline: '1px dashed red' }}>{children}</div>;
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


type Item = {
  id: string;
  name: string;
  
  
  price: number;
  quantity: number;
  image?: string;
};

// Checkout SDK
type CheckoutItem = {
  id: string;

  slot: string;

  name: string;
  // price: number;
  quantity: number;
  image?: string;
  metadata?: Record<string, any>;

  subtotal: number;
  taxes: number;
  shipping: number;
  discount: number;
  total: number;
};

interface CheckoutSession {

  id: string;
  // closed?
  status: 'open' | 'processing' | 'completed' | 'abandoned';
  items: CheckoutItem[];

  currency: string;
  subtotal: number;
  taxes: number;
  shipping: number;
  discount: number;
  total: number;

  customer?: Customer;
  shipping_address?: CheckoutAddress;
  billing_address?: CheckoutAddress;
  currency: string;
  metadata: Record<string, any>;
  discount_code?: string;
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

type NavigationContextType = {
  currentPage: number;
  goToNextPage: (fieldErrors: Record<string, string[]>) => void;
}
const NavigationContext = createContext<NavigationContextType | null>(null)

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

export const NavigationProvider = ({ children,  }: { children: React.ReactNode }) => {

  const { offer } = useCheckoutState();
  const { fieldStates } = useCheckoutState()
  // remember current page from state 
  
  const pages = useMemo(() => {
    return offer.view.pages;
  }, [offer])

  const [currentPageId, setCurrentPageId] = useState(offer.view.first_page);

  const currentPage = useMemo(() => {
    return pages[currentPageId];
  }, [currentPageId, pages])

  const canNavigateToNextPage = (fieldErrors: Record<string, string[]>) => {
    // Check if any fields have errors. If yes, don't navigate.
    return Object.values(fieldErrors).every((error) => !error)
  }

  const goToNextPage = (fieldErrors: Record<string, string[]>) => {
    if (canNavigateToNextPage(fieldErrors)) {
      console.info('Can navigate to next page!')
      // todo: figure this out
      // determine the next page
      const nextPage = handleNavigationLogic(currentPage, (field) => {
        return fieldStates[field].value
      })
      console.log({ nextPage })
      setCurrentPageId(nextPage);
    } else {
      console.log('Validation failed, cannot navigate.')
    }
  }
  const [pageHistory, setPageHistory] = useState<string[]>([]);
    
  const [completedPages, setCompletedPages] = useState<string[]>([]);


   // Navigation functions
  //  const navigateTo = (pageId: string, addToHistory = true) => {
  //   if (addToHistory && currentPageId !== pageId) {
  //     // Add current page to history
  //     setPageHistory(prev => [...prev, currentPageId]);
      
  //     // Add to completed pages if not already there
  //     if (!completedPages.includes(currentPageId)) {
  //       setCompletedPages(prev => [...prev, currentPageId]);
  //     }
  //   }
    
  //   // Navigate to new page
  //   setCurrentPageId(pageId);
  // };
  
  // const goBack = () => {
  //   if (pageHistory.length > 0) {
  //     // Get last page from history
  //     const previousPage = pageHistory[pageHistory.length - 1];
      
  //     // Update current page
  //     setCurrentPageId(previousPage);
      
  //     // Remove from history
  //     setPageHistory(prev => prev.slice(0, prev.length - 1));
  //   }
  // };

  return (
    <NavigationContext.Provider value={{ currentPage, currentPageId, pageHistory, completedPages, goToNextPage }}>
      {children}
    </NavigationContext.Provider>
  )
}

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

  const backendValidateFields = async (fields) => {
    // Call API to validate fields
    const res = await fetch('/api/validate', {
      method: 'POST',
      body: JSON.stringify(fields),
    })
    const data = await res.json()
    return data.errors || {}
  }

  return { validateAllFields }
}

function useNavigation() {
  const { currentPage, goToNextPage } = useContext(NavigationContext)
  return { currentPage, goToNextPage }
}

// checkout context?
// Replace CheckoutLayout with CheckoutPage component
const CheckoutController = ({ offer }: { offer: OfferConfiguration }) => {
  const { 
    // currentPageId,
    // submitPage,
    // errors
    session,
    fields,

  } = useCheckoutState();

  const { validateAllFields } = useValidateFields()
  const { currentPage, goToNextPage } = useNavigation();
  
  const handleSubmit = async (evt: React.FormEvent) => {
    evt.preventDefault();
    
    const errors = await validateAllFields();
    console.log({ errors })

    goToNextPage(errors);
  };
  
  if (!currentPage) {
    console.error('No page found');
    return null;
  }
  
  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Display form-level errors if any */}
      {/* {errors.form && (
        <div className="bg-red-50 text-red-700 p-4 mb-4 rounded-md">
          {errors.form.map((error, index) => (
            <p key={index}>{error}</p>
          ))}
        </div>
      )} */}
      
      <TailwindLayoutRenderer
        layoutConfig={layoutConfig}
        page={currentPage}
        components={{ NavigationBar }}
      />
    </form>
  );
};




// Update main Checkout component to use FormProvider and CheckoutProvider
interface Props {
  offer: OfferConfiguration;
  error?: string | null;
  embedDomain?: string;
  environment?: string;
}

export default function Checkout({ offer, error, environment = 'live' }: Props) {

  if (error) {
    return <LoadingError error={error}/>;
  }

  const firstPage = offer.view.pages[offer.view.first_page];

  if (!firstPage) {
    return <PageNotFound/>;
  }

  // checkout controller controls the entire process 
  
  // use a theme one too?

  return (
    <>
      <Head title={`Checkout: ${offer.name}`} />

      {/* global state, checkout */}
      <GlobalStateProvider offer={offer}>
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
  if (!globalState) {
    throw new Error('StateDisplay must be used within a GlobalStateProvider');
  }
  
  const stateDisplay = Object.entries(globalState.fieldStates).reduce((acc, [key, state]) => {
    acc[key] = state.value;
    return acc;
  }, {} as Record<string, any>);

  console.log({ globalState, stateDisplay });

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
          {Object.entries(stateDisplay).map(([key, value]) => (
            <tr key={key}>
              <td className="px-1">{key}</td>
              <td className="px-1">{JSON.stringify(value, null, 2)}</td>
            </tr>
          ))}
        </tbody>
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

function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}