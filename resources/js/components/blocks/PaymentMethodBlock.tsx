import { useState, useEffect, useCallback } from "react";
import Numi from "@/contexts/Numi";
import { IntegrationClient } from "@/types/checkout";
import StripeElementsComponent from "./StripeElementsBlock";
import axios from "@/lib/axios";

function PaymentMethodBlock() {
  const { session } = Numi.useCheckout({});
  const [showForm, setShowForm] = useState(!session?.payment_method);
  const [isRedirectPayment, setIsRedirectPayment] = useState(false);

  // Reset form state when session changes (e.g., after refresh)
  useEffect(() => {
    console.log('PaymentMethodBlock: Session updated', {
      hasPaymentMethod: !!session?.payment_method,
      paymentMethod: session?.payment_method,
      hasCustomer: !!session?.customer,
      customer: session?.customer,
    });

    setShowForm(!session?.payment_method);

    // Check if this is a redirect payment that needs completion
    if (session?.metadata?.is_redirect_payment && session?.metadata?.pending_confirmation_token) {
      setIsRedirectPayment(true);
      completeRedirectPayment();
    }
  }, [session?.payment_method, session?.metadata]);

  const completeRedirectPayment = useCallback(async () => {
    try {
      const response = await axios.post(`/checkouts/${session?.id}/mutations`, {
        action: 'completeRedirectPayment',
      });

      if (response.data.checkout_session) {
        // Refresh the session with the updated data
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to complete redirect payment:', error);
    }
  }, [session?.id]);

  const handleSuccess = useCallback(() => {
    setShowForm(false);
  }, []);

  if (
    session.integration_client === IntegrationClient.STRIPE ||
    session.integration_client === IntegrationClient.STRIPE_TEST
  ) {
    // Show loading state for redirect payment completion
    if (isRedirectPayment) {
      return (
        <div className="border p-4 rounded bg-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-sm text-blue-700">Completing your payment...</div>
          </div>
        </div>
      );
    }

    if (session.payment_method && !showForm) {
      const pm = session.payment_method;
      return (
        <div className="border p-4 rounded bg-gray-50 flex items-center justify-between">
          <div>
            <div>
              <span className="font-semibold">{pm.type?.toUpperCase()}</span>{" "}
              {pm.card && (
                <>
                  {pm.card.brand} •••• {pm.card.last4} (exp {pm.card.exp_month}/{pm.card.exp_year})
                </>
              )}
            </div>
            <div className="text-xs text-gray-500">
              {pm.billing_details?.name} &lt;{pm.billing_details?.email}&gt;
            </div>
          </div>
          <button
            className="text-blue-600 underline"
            onClick={() => setShowForm(true)}
          >
            Change
          </button>
        </div>
      );
    }
    return (
      <StripeElementsComponent
        onSuccess={handleSuccess}
        emailAddress={session.properties?.email}
        onEmailChange={(email) => {
          // Update session properties with email
          console.log('PaymentMethodBlock: Email changed to', email);
        }}
      />
    );
  }

  return <div>Could not load payment method block {session.integration_client}</div>;
}

export default PaymentMethodBlock;
