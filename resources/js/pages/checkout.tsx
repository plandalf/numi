import { Head } from '@inertiajs/react';
import {
  GlobalStateProvider, layoutConfig,
  LoadingError,
  NavigationProvider, PageNotFound, Section,
  useCheckoutState,
  useNavigation,
  useValidateFields
} from '@/pages/checkout-main';
import type { OfferConfiguration, Page, PageSection } from '@/types/offer';
import { CheckoutPageProps, CheckoutSession, NavigationBarProps, TailwindLayoutRendererProps } from '@/types/checkout';
import { findUniqueFontsFromTheme, findUniqueFontsFromView } from '@/utils/font-finder';
import WebFont from 'webfontloader';
import { Theme } from '@/types/theme';
import { resolveThemeValue } from '@/lib/theme';
import { ChevronLeftIcon } from 'lucide-react';
import { useMemo } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { sendMessage } from '@/utils/sendMessage';
import { OnInit } from '@/events/OnInit';
import { useEffect } from 'react';
import { PageChanged } from '@/events/PageChanged';
import { PaymentInitialized } from '@/events/PaymentInitialized';


export const NavigationBar = ({ barStyle, children, className, ...props }: NavigationBarProps) => {
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
          className="relative m-0 h-4 w-8 cursor-pointer hover:scale-105 transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900 flex-shrink-0 flex items-center"
        >
          <ChevronLeftIcon strokeWidth={4} className="size-6 absolute -left-1 top-1/2 -translate-y-1/2" />
        </button>
      )}
      <div className="flex-grow">
      {children}
      </div>
    </div>
  );
};

const TailwindLayoutRenderer = ({
  theme,
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
  return renderElement(config.template, page, { componentRegistry, contentMap: {}}, theme, false);
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
  },
  theme: Theme,
  isContained?: boolean
): React.ReactNode => {
  // Return null for undefined or null elements
  if (!element) return null;

  const { type, props = {}, children = [], id } = element;
  const { componentRegistry, contentMap } = context;

  // Render child elements recursively
  const childElements = Array.isArray(children)
    ? children.map((child, index) => renderElement(
      child,
      page,
      context,
      theme,
      ((page?.view[id ?? ''] as PageSection)?.asContainer ?? false)
    ))
    : null;

  // If this element has an ID, check if it matches a section in the page view
  if (id && page.view[id]) {
    const section = page.view[id] as PageSection;
    if (section && section.blocks) {
      const backgroundColor = isContained ? section.style?.backgroundColor : resolveThemeValue(section.style?.backgroundColor, theme, 'canvas_color') as string;
      const padding = section?.appearance?.padding;
      const margin = section?.appearance?.margin;
      const backgroundImage = section?.style?.backgroundImage;
      const hidden = section?.style?.hidden;
      const borderRadius = section?.style?.borderRadius;

      if (!element) return null;

      // Render the section with its blocks
      return createElement(
        type,
        {
          ...props,
          style: {
            ...props.style,
            backgroundColor,
            padding,
            borderRadius: borderRadius,
            margin: margin === 'none' ? '0px' : margin,
            ...(backgroundImage ? {
              backgroundImage: `url(${backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            } : {}),
            ...(hidden ? {display: 'none'} : {}),
            gap: (section as PageSection)?.appearance?.spacing
          },
          id,
        },
        <Section blocks={section.blocks} className={props.className} children={childElements} />,
        componentRegistry
      );
    }
  }
  // Return the appropriate React element based on type
  return createElement(type, { ...props, key: id || `${type}`, }, childElements, componentRegistry);
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

  const {key, id, ...componentProps} = props;

  // If we have a custom component registered for this type, use it
  if (componentRegistry[type]) {
    const Component = componentRegistry[type];
    return <Component key={key ?? props.id} {...props}>{children}</Component>;
  }

  // Use a div
  return <div key={key ?? props.id} {...componentProps}>{children}</div>;
};




const CheckoutController = ({ offer, session }: { offer: OfferConfiguration, session: CheckoutSession }) => {
  const {
    isSubmitting,
    submitError,
    clearErrors,
    setSubmitting,
    setSubmitError,
    submitPage,
  } = useCheckoutState();
  const isMobile = useIsMobile();

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

  const isHosted = offer.is_hosted && !isMobile;
  const hostedPage = offer.hosted_page;
  const style = hostedPage?.style;
  const appearance = hostedPage?.appearance;

  const formClassName = useMemo(() => {
    if (isHosted) {
      return 'transition-all bg-background rounded-lg shadow-lg w-full h-full max-w-5xl flex items-center justify-center';
    }

    return 'min-h-screen relative h-screen w-full';
  }, [isHosted, isMobile]);

  const formStyle = useMemo(() => {
    if (isHosted) {
      return {
        minHeight: style?.maxHeight?.height ?? "764px",
        maxHeight: style?.maxHeight?.height ?? "764px",
        minWidth: style?.maxWidth?.width ?? "1024px",
        maxWidth: style?.maxWidth?.width ?? "1024px",
        ...(style?.shadow ? {
          boxShadow: style.shadow,
        } : {}),
        ...(style?.border ? {
          borderWidth: style.border?.width,
          borderStyle: style.border?.style,
        } : {}),
        ...(style?.borderColor ? {
          borderColor: style.borderColor,
        } : {}),
        ...(style?.borderRadius ? {
          borderRadius: style.borderRadius,
          overflow: 'hidden',
        } : {}),
      };
    }
    return {};
  }, [isHosted, style, appearance]);

  const logoStyle = useMemo(() => {
      return {
        width: style?.logoDimension?.width ?? '60px',
        height: style?.logoDimension?.height ?? '60px',
      };
  }, [style]);

  useEffect(() => {
    if (currentPage.type === 'payment') {
      sendMessage(new PaymentInitialized(session));
    }

    sendMessage(new PageChanged(currentPage.id));
  }, [currentPage]);

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
      {isHosted && hostedPage?.logo_image && (
          <img src={hostedPage.logo_image.url} style={logoStyle} />
      )}
      <form
        onSubmit={handleSubmit}
        noValidate
        className={formClassName}
        style={formStyle}
      >
        <TailwindLayoutRenderer
          theme={offer.theme}
          layoutConfig={layoutConfig}
          page={currentPage}
          components={{ NavigationBar }}
        />
      </form>
    </>
  );
};


export default function CheckoutPage({ offer, fonts, error, checkoutSession }: CheckoutPageProps) {

  if (error) {
    return <LoadingError error={error}/>;
  }

  const firstPage = offer.view.pages[offer.view.first_page];

  if (!firstPage) {
    return <PageNotFound/>;
  }

  // Find and load all unique fonts
  const viewFonts = findUniqueFontsFromView(offer.view);
  const themeFonts = findUniqueFontsFromTheme(offer.theme);

  const uniqueFonts = fonts
    .filter(f => ['Inter', ...viewFonts, ...themeFonts].includes(f.name))
    .map(font => `${font.name}:${font.weights.join(',')}`);


  if(uniqueFonts.length > 0) {
    WebFont.load({ google: { families: uniqueFonts }});
  }

  const containerStyle = useMemo(() => {
    if (offer?.is_hosted) {
      return {
        ...(offer?.hosted_page?.background_image ? {
          backgroundImage: `url(${offer?.hosted_page?.background_image?.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : offer?.hosted_page?.style?.backgroundColor ? {
          backgroundColor: offer?.hosted_page?.style?.backgroundColor,
        } : {}),
        ...(offer?.hosted_page?.style?.logoSpacing ? {
          gap: offer?.hosted_page?.style?.logoSpacing?.height,
        } : {}),
        ...(offer?.hosted_page?.appearance?.padding ? {
          padding: offer?.hosted_page?.appearance?.padding,
        } : {}),
      };
    }
    return {};
  }, [offer?.is_hosted, offer?.hosted_page]);

  useEffect(() => {
    sendMessage(new OnInit(checkoutSession));
  }, []);

  return (
    <>
      <Head title={`Checkout: ${offer.name ?? 'Untitled Offer'}`} />
      <GlobalStateProvider offer={offer} session={checkoutSession}>
        <NavigationProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col gap-4 justify-center items-center" style={containerStyle}>
            {error ? (
              <div className="p-4">
                <div className="bg-red-50 text-red-900 p-4 rounded-md">
                  {error}
                </div>
              </div>
            ) : (
                <CheckoutController offer={offer} session={checkoutSession} />
            )}
          </div>
        </NavigationProvider>
      </GlobalStateProvider>
    </>
  );
}
