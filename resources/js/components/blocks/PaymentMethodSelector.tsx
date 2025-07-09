import React, { useState, useEffect } from 'react';
import { useStripe, useElements } from '@stripe/react-stripe-js';
import { PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { useCheckoutState } from '@/pages/checkout-main';
import Numi from '@/contexts/Numi';
import { SavedPaymentMethod } from '@/types/checkout';
import axios from '@/lib/axios';

interface PaymentMethodSelectorProps {
  style?: React.CSSProperties;
}

export function PaymentMethodSelector({ style }: PaymentMethodSelectorProps) {
  const stripe = useStripe();
  const elements = useElements();
  const checkoutState = useCheckoutState();
  const { setPageSubmissionProps } = checkoutState as { setPageSubmissionProps: (callback: () => Promise<unknown>) => void };
  const { session } = Numi.useCheckout();
  
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPaymentForm, setShowNewPaymentForm] = useState(true);
  const [isLoadingSavedMethods, setIsLoadingSavedMethods] = useState(false);

  // Load saved payment methods if customer exists
  useEffect(() => {
    if (session.customer?.id) {
      setIsLoadingSavedMethods(true);
      axios.get(`/api/customers/${session.customer.id}/payment-methods`)
        .then(response => {
          setSavedPaymentMethods(response.data.payment_methods || []);
          // If there are saved methods, show them by default
          if (response.data.payment_methods?.length > 0) {
            setShowNewPaymentForm(false);
          }
        })
        .catch(error => {
          console.error('Failed to load saved payment methods:', error);
        })
        .finally(() => {
          setIsLoadingSavedMethods(false);
        });
    }
  }, [session.customer]);

  useEffect(() => {
    setPageSubmissionProps(async () => {
      if (!stripe || !elements) {
        return {
          error: 'Stripe has not been initialized',
          type: 'validation_error',
          code: 'stripe_not_initialized',
        };
      }

      setIsLoading(true);

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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        return {
          error: errorMessage,
          type: 'api_error',
          code: 'unexpected_error',
        };
      } finally {
        setIsLoading(false);
      }
    });
  }, [stripe, elements]);

  const handleSavedMethodSelect = (methodId: string) => {
    setSelectedSavedMethod(methodId);
    setShowNewPaymentForm(false);
  };

  const handleUseNewPaymentMethod = () => {
    setSelectedSavedMethod(null);
    setShowNewPaymentForm(true);
  };

  return (
    <div className="flex flex-col space-y-4" style={style}>
      {/* Saved Payment Methods */}
      {savedPaymentMethods.length > 0 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Previously Used Payment Methods
          </label>
          <div className="grid grid-cols-1 gap-3">
            {savedPaymentMethods.map((method) => (
              <label
                key={method.id}
                className={`relative flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedSavedMethod === method.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input
                  type="radio"
                  name="savedPaymentMethod"
                  value={method.id}
                  checked={selectedSavedMethod === method.id}
                  onChange={(e) => handleSavedMethodSelect(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedSavedMethod === method.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedSavedMethod === method.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {method.display_name}
                    </span>
                    {method.is_default && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Default
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    Last used {new Date(method.last_used_at).toLocaleDateString()}
                  </span>
                </div>
              </label>
            ))}
          </div>
          
          {/* Use New Payment Method Option */}
          <button
            type="button"
            onClick={handleUseNewPaymentMethod}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            Use a different payment method
          </button>
        </div>
      )}

      {/* Loading State for Saved Methods */}
      {isLoadingSavedMethods && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Loading saved payment methods...</span>
        </div>
      )}

      {/* New Payment Method Form */}
      {showNewPaymentForm && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Payment Details
          </label>
          <div className="border border-gray-300 rounded-lg p-4">
            <PaymentElement
              options={{
                defaultValues: {
                  billingDetails: {
                    name: '',
                    email: '',
                  },
                },
                layout: {
                  type: 'tabs',
                  defaultCollapsed: false,
                },
                wallets: {
                  applePay: 'auto' as const,
                  googlePay: 'auto' as const,
                },
              }}
            />
          </div>
        </div>
      )}

      {/* Billing Address */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Billing Address
        </label>
        <div className="border border-gray-300 rounded-lg p-4">
          <AddressElement
            options={{
              mode: 'billing',
            }}
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-sm text-gray-600">Processing payment...</span>
        </div>
      )}
    </div>
  );
} 