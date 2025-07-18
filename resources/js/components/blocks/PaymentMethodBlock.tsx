import Numi from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { IntegrationClient } from "@/types/checkout";
import StripeElementsComponent from "./StripeElementsBlock";

// This should be loaded from your environment variables
function PaymentMethodBlock({ context }: { context: BlockContextType }) {
  const { session } = Numi.useCheckout({});

  if (session.integration_client === IntegrationClient.STRIPE
    || session.integration_client === IntegrationClient.STRIPE_TEST
  ) {
    return (
      <StripeElementsComponent context={context} />
    );
  }
  return (
    <div>      
      
    </div>
  );
}

export default PaymentMethodBlock;
