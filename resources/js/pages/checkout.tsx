import { Head } from '@inertiajs/react';
import {
  GlobalStateProvider,
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
import { ChevronLeftIcon } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { sendMessage } from '@/utils/sendMessage';
import { OnInit } from '@/events/OnInit';
import { useEffect } from 'react';
import { PageChanged } from '@/events/PageChanged';
import { PaymentInitialized } from '@/events/PaymentInitialized';
import { getLayoutJSONConfig } from '@/config/layouts';

// Helper function to generate meta tags
const generateMetaTags = (offer: OfferConfiguration) => {
  const title = offer.name || 'Complete Your Purchase';
  const description = offer.description || `Secure checkout for ${offer.name}`;
  const imageUrl = offer.product_image?.url;
  const themeColor = offer.theme?.primary_color || offer.organization?.primary_color || '#3B82F6';
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Use organization info if available, fallback to Numi
  const organizationName = offer.organization?.name || 'Plandalf';
  const organizationDescription = offer.organization?.description || 'Secure checkout platform';
  const organizationUrl = offer.organization?.website_url || 'https://plandalf.dev';
  const organizationLogo = offer.organization?.logo_media?.url || offer.hosted_page?.logo_image?.url;
  const organizationFavicon = offer.organization?.favicon_media?.url;

  return {
    title: `Checkout: ${offer.name ?? 'Untitled Offer'}`,
    description,
    imageUrl,
    themeColor,
    currentUrl,
    organizationName,
    organizationDescription,
    organizationUrl,
    organizationLogo,
    organizationFavicon,
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": title,
      "description": description,
      "url": currentUrl,
      "publisher": {
        "@type": "Organization",
        "name": organizationName,
        "description": organizationDescription,
        "url": organizationUrl,
        ...(organizationLogo && { "logo": { "@type": "ImageObject", "url": organizationLogo } })
      },
      "mainEntity": {
        "@type": "Offer",
        "name": offer.name,
        "description": offer.description,
        "price": offer.items?.[0]?.prices?.[0]?.amount,
        "priceCurrency": offer.items?.[0]?.prices?.[0]?.currency || "USD",
        "seller": {
          "@type": "Organization",
          "name": organizationName,
          "url": organizationUrl
        }
      }
    }
  };
};

export const NavigationBar = ({ children, className, ...props }: NavigationBarProps) => {
  const { goToPrevPage, canGoBack, canGoForward } = useNavigation();

  function onBack() {
    goToPrevPage();
  }

  return (
    <div className={`${className} flex flex-row items-center`} {...props}>
      {canGoBack() && (
        <button
          onClick={onBack}
          type="button"
          className="relative m-0 h-4 w-8 cursor-pointer hover:scale-105 transition-all duration-300 text-sm font-medium text-gray-700 hover:text-gray-900 flex-shrink-0 flex items-center"
        >
          <ChevronLeftIcon strokeWidth={4} className="size-6 absolute -left-1 top-1/2 -translate-y-1/2" />
        </button>
      )}
      <div className="flex-grow flex-col">
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
      const backgroundColor = isContained ? section.style?.backgroundColor : section.style?.backgroundColor;
      const padding = section?.appearance?.padding;
      const margin = section?.appearance?.margin;
      const spacing = section?.appearance?.spacing;
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
            gap: spacing
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

  // Separate state for toast visibility
  const [showErrorToast, setShowErrorToast] = useState(false);

  // Show toast when submitError changes
  useEffect(() => {
    if (submitError) {
      setShowErrorToast(true);
    }
  }, [submitError]);

  // Auto-hide toast after 3 seconds (but keep submitError state)
  useEffect(() => {
    if (showErrorToast) {
      const timer = setTimeout(() => {
        setShowErrorToast(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showErrorToast]);

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
        // minWidth: style?.maxWidth?.width ?? "1024px",
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

    if (currentPage === 'ending' && session.order?.id) {
      // sendMessage(new CheckoutCompleted(session.order));
    }

    sendMessage(new PageChanged(currentPage.id));
  }, [currentPage]);


  // Get the dynamic layout configuration
  const layoutConfig = useMemo(() => getLayoutJSONConfig(currentPage?.layout?.sm?.split('@')[0] ?? 'promo'), [currentPage?.layout?.sm]);

  if (!currentPage) {
    console.error('No page found');
    return null;
  }

  return (
    <>
      {/* Fixed error toast */}
      {showErrorToast && submitError && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md">
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
                  onClick={() => setShowErrorToast(false)}
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
  const firstPage = offer.view.pages[offer.view.first_page];

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
  const metaTags = generateMetaTags(offer);

  if (!firstPage) {
    return <PageNotFound/>;
  }

  if (error) {
    return <LoadingError error={error}/>;
  }

  return (
    <>
      <Head>
        <title>{metaTags.title}</title>

        {/* Basic Meta Tags */}
        <meta name="description" content={metaTags.description} />
        <meta name="keywords" content="checkout, payment, purchase, secure" />
        <meta name="author" content={metaTags.organizationName} />
        <meta name="robots" content="noindex, nofollow" />

        {/* Favicon */}
        {metaTags.organizationFavicon && <link rel="icon" href={metaTags.organizationFavicon} />}

        {/* Open Graph Meta Tags for Social Media */}
        <meta property="og:title" content={metaTags.title} />
        <meta property="og:description" content={metaTags.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={metaTags.currentUrl} />
        <meta property="og:site_name" content={`${metaTags.organizationName} Checkout`} />

        {/* Open Graph Image */}
        {offer.social_image?.url && (
          <meta property="og:image" content={offer.social_image?.url} />
        )}
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={offer.name || 'Offer Image'} />

        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTags.title} />
        <meta name="twitter:description" content={metaTags.description} />
        {/* {offer.social_image?.url ? (
          <>
            <meta name="twitter:image" content={offer.social_image.url} />
            <meta name="twitter:image:alt" content={offer.name || 'Offer Image'} />
          </>
        ) : metaTags.imageUrl ? (
          <>
            <meta name="twitter:image" content={metaTags.imageUrl} />
            <meta name="twitter:image:alt" content={offer.name || 'Offer Image'} />
          </>
        ) : metaTags.organizationLogo ? (
          <meta name="twitter:image" content={metaTags.organizationLogo} />
        ) : null} */}

        {/* Security and Privacy Meta Tags */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />

        {/* Viewport and Mobile Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={`${metaTags.organizationName} Checkout`} />

        {/* Theme and Color Meta Tags */}
        <meta name="theme-color" content={metaTags.themeColor} />
        <meta name="msapplication-TileColor" content={metaTags.themeColor} />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Canonical URL */}
        <link rel="canonical" href={metaTags.currentUrl} />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Structured Data for SEO */}
        <script type="application/ld+json">
          {JSON.stringify(metaTags.structuredData)}
        </script>
      </Head>
      <GlobalStateProvider offer={offer} session={checkoutSession} offerItems={offer.items}>
        {checkoutSession.is_test_mode && (
          <div className="bg-yellow-50 text-yellow-700 border-b border-yellow-200">
            <p className="text-sm text-center py-1 font-semibold">You are in test mode. No real transactions will occur.</p>
          </div>
        )}
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
