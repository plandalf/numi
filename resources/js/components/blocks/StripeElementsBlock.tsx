import Numi, { Appearance, Style } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { useState, useEffect, useRef, useMemo } from "react";
import { Elements, PaymentElement, useStripe, useElements, AddressElement } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useCheckoutState } from "@/pages/checkout-main";

// Define the type for the checkout state
interface CheckoutState {
  setPageSubmissionProps: (props: (() => Promise<any>) | null) => void;
}

// This should be loaded from your environment variables
function StripeElementsComponent({ context }: { context: BlockContextType }) {
  const { session } = Numi.useCheckout({});

  const [stripePromise, setStripePromise] = useState<Stripe | null>(null);

  const [title] = Numi.useStateString({
    label: 'Title',
    name: 'title',
    defaultValue: 'Payment Information',
    inspector: 'text',
  });

  const [description] = Numi.useStateString({
    label: 'Description',
    name: 'description',
    defaultValue: 'Enter your payment details to complete your purchase',
    inspector: 'text',
  });

  const fontConfig = {
    config: {
      hideVerticalAlignment: true,
      hideHorizontalAlignment: true,
    },
  };

  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {
      options: {
        start: 'start',
        center: 'center',
        end: 'end',
      },
    }, 'left'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),
    Style.font('titleTextFont', 'Title Text Font && Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '500',
        size: '18px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.font('descriptionTextFont', 'Description Text Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),

    // Error panel
    Style.backgroundColor('errorBackgroundColor', 'Error Background Color', {}, '#ffc9c9'),
    Style.font('errorTextFont', 'Error Text Font & Color',
      fontConfig,
      {
        color: '#c10007',
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.border('errorBorder', 'Error Border', {}, { width: '1px', style: 'solid' }),
    Style.borderColor('errorBorderColor', 'Error Border Color', {}, '#ffc9c9'),

    // Warning panel
    Style.backgroundColor('warningBackgroundColor', 'Warning Background Color', {}, '#fefce8'),
    Style.font('warningTextFont', 'Warning Text Font & Color',
      fontConfig,
      {
        color: '#a65f00',
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.border('warningBorder', 'Warning Border', {}, { width: '1px', style: 'solid' }),
    Style.borderColor('warningBorderColor', 'Warning Border Color', {}, '#fff085'),


    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '0px'),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, ''),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);
  
  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const containerStyle = useMemo(() => ({
    alignItems: style.alignment,
    backgroundColor: style.backgroundColor || 'transparent',
    borderColor: style.borderColor,
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius ?? '3px',
    boxShadow: style.shadow,
    padding: appearance?.padding,
    margin: appearance?.margin,
    gap: appearance?.spacing,
  }), [style, appearance]);

  const titleStyle = useMemo(() => ({
    color: style.titleTextFont?.color,
    fontFamily: style.titleTextFont?.font,
    fontSize: style.titleTextFont?.size,
    fontWeight: style.titleTextFont?.weight,
    lineHeight: style.titleTextFont?.lineHeight,
    letterSpacing: style.titleTextFont?.letterSpacing,
  }), [style]);

  const descriptionStyle = useMemo(() => ({
    color: style.descriptionTextFont?.color,
    fontFamily: style.descriptionTextFont?.font,
    fontSize: style.descriptionTextFont?.size,
    fontWeight: style.descriptionTextFont?.weight,
    lineHeight: style.descriptionTextFont?.lineHeight,
    letterSpacing: style.descriptionTextFont?.letterSpacing,
  }), [style]);

  const errorPanelStyle = useMemo(() => ({
    backgroundColor: style.errorBackgroundColor,
    color: style.errorTextFont?.color,
    fontFamily: style.errorTextFont?.font,
    fontSize: style.errorTextFont?.size,
    fontWeight: style.errorTextFont?.weight,
    lineHeight: style.errorTextFont?.lineHeight,
    letterSpacing: style.errorTextFont?.letterSpacing,
    borderColor: style.errorBorderColor,
    borderWidth: style.errorBorder?.width,
    borderStyle: style.errorBorder?.style,
    borderRadius : style.errorBorderRadius ?? '3px',
  }), [style]);

  const warningPanelStyle = useMemo(() => ({
    backgroundColor: style.warningBackgroundColor,
    color: style.warningTextFont?.color,
    fontFamily: style.warningTextFont?.font,
    fontSize: style.warningTextFont?.size,
    fontWeight: style.warningTextFont?.weight,
    lineHeight: style.warningTextFont?.lineHeight,
    letterSpacing: style.warningTextFont?.letterSpacing,
    borderColor: style.warningBorderColor,
    borderWidth: style.warningBorder?.width,
    borderStyle: style.warningBorder?.style,
    borderRadius : style.warningBorderRadius ?? '3px',
  }), [style]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializationAttempted = useRef(false);
  const [stripeError, setStripeError] = useState(null);

  useEffect(() => {
    async function initializeStripe() {
      if (initializationAttempted.current) return;
      initializationAttempted.current = true;

      try {
        if (!session.publishable_key) {
          throw new Error('Stripe publishable key is missing');
        }
        const stripe = await loadStripe(session.publishable_key);
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }
        setStripePromise(stripe);
      } catch (error: any) {
        console.error('Stripe initialization error:', error);
        setStripeError(error.message);
      }

      setIsLoading(false)
    }

    initializeStripe();
  }, [session.publishable_key]);
  
  if(style.hidden) {
    return null;
  }

  return (
    <div className="flex flex-col" style={containerStyle}>
      <h3 className="text-lg font-medium mb-2" style={titleStyle}>{title}</h3>
      <p className="text-sm text-gray-600 mb-4" style={descriptionStyle}>{description}</p>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" style={errorPanelStyle}>
          {error}
        </div>
      ) : stripePromise ? (
        <Elements stripe={stripePromise} options={{ mode: 'setup', currency: session.currency.toLocaleLowerCase() }}>
          <PaymentForm />
        </Elements>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded" style={warningPanelStyle}>
          Unable to initialize payment. Please try again later.
        </div>
      )}
    </div>
  );
}

// Separate component for the payment form to use Stripe hooks
function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { setPageSubmissionProps } = useCheckoutState() as CheckoutState;

  useEffect(() => {
    setPageSubmissionProps(async () => {
      if (!stripe || !elements) {
        return {
          error: 'Stripe has not been initialized',
          type: 'validation_error',
          code: 'stripe_not_initialized',
        };
      }

      try {
        // Submit the form to validate the payment method
        const { error: submitError } = await elements.submit();
        if (submitError) {
          return {
            error: submitError.message,
            type: submitError.type,
            code: submitError.code,
          };
        }

        // Create a confirmation token
        const confirmationTokenResult = await stripe.createConfirmationToken({
          elements,
          params: {}
        });

        if (confirmationTokenResult.error) {
          return {
            error: confirmationTokenResult.error.message,
            type: confirmationTokenResult.error.type,
            code: confirmationTokenResult.error.code,
          };
        }

        return {
          confirmation_token: confirmationTokenResult.confirmationToken?.id
        };
      } catch (error: any) {
        return {
          error: error.message,
          type: 'api_error',
          code: 'unexpected_error',
        };
      }
    });
  }, [stripe, elements]);

  return (
    <div className="space-y-4">
      <PaymentElement
        options={{
          defaultValues: {
            billingDetails: {
              name: '',
              email: '',
            },
          },
        }}
      />
      <AddressElement
        options={{
          mode: 'billing',
        }}
      />
    </div>
  );
}

export default StripeElementsComponent;
