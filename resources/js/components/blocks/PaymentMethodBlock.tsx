import { useState, useEffect, useCallback } from "react";
import Numi from "@/contexts/Numi";
import { IntegrationClient } from "@/types/checkout";
import StripeElementsComponent from "./StripeElementsBlock";
import axios from "@/lib/axios";
import { useNavigation } from '@/pages/client/checkout-main';

function PaymentMethodBlock() {
  const { currentPage, goToNextPage } = useNavigation();
  const { session, submitPage} = Numi.useCheckout({});
  const [showForm, setShowForm] = useState(!session?.payment_method);
  const [isRedirectPayment, setIsRedirectPayment] = useState(false);

  // useeffect, if theres a next_action=confirm_automatically in the url we need to submit the form! (somehow)
  useEffect( () => {
    const doSomething = async () => {
      const url = new URL(window.location.href);
      if (url.searchParams.get("next_action") === "confirm_automatically") {
        await submitPage(currentPage.id);
        goToNextPage({});
      }
    }
    doSomething()
  }, []);

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
              {pm.type === 'card' && (
                <>
                  {pm.properties.brand} •••• {pm.properties.last4} (exp {pm.properties.exp_month}/{pm.properties.exp_year})
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
          // console.log('PaymentMethodBlock: Email changed to', email);
        }}
      />
    );
  }

  return <div>Could not load payment method block {session.integration_client}</div>;
}

export default PaymentMethodBlock;
