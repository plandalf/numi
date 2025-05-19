import Numi, { Appearance } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { useState, useEffect, useRef } from "react";
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
    name: 'title',
    defaultValue: 'Payment Information',
    inspector: 'text',
  });

  const [description] = Numi.useStateString({
    name: 'description',
    defaultValue: 'Enter your payment details to complete your purchase',
    inspector: 'text',
  });
  
  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

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

  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      <div className="text-xs bg-gray-100 p-1 mb-4 rounded">StripeElementsComponent: {context.blockId}</div>

      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : stripePromise ? (
        <Elements stripe={stripePromise} options={{ mode: 'setup', currency: session.currency.toLocaleLowerCase() }}>
          <PaymentForm />
        </Elements>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
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
