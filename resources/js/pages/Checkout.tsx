import { Head } from '@inertiajs/react';
import { useState, useContext } from 'react';
import { type Block, type OfferConfiguration, } from '@/types/offer';
import { cn } from '@/lib/utils';

import { blockTypes } from '@/components/blocks';
import axios from '@/lib/axios';
import { CheckoutSession } from '@/types/checkout';
import { useCheckoutState, GlobalStateContext, GlobalStateProvider } from '@/contexts/GlobalStateProvider';
import { Page, NavigationHistoryEntry, NavigationProvider, useNavigation } from '@/contexts/NavigationProvider';
import { BlockRenderer  } from "@/components/checkout/BlockRenderer"
// Form and validation context
type FormData = Record<string, any>;
type ValidationErrors = Record<string, string[]>;

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

const NavigationBar = ({ barStyle, children, className, ...props }: NavigationBarProps) => {
  const { goToPrevPage, canGoBack, canGoForward } = useNavigation();

  function onBack() {
    goToPrevPage();
  }

  return (
    <div className={`${className} border-2 border-orange-500 flex items-center justify-between`} {...props}>
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
