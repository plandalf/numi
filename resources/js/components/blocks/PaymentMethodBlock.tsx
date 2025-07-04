import Numi from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { IntegrationClient } from "@/types/checkout";
import StripeElementsComponent from "./StripeElementsBlock";

// This should be loaded from your environment variables
function PaymentMethodBlock({ context }: { context: BlockContextType }) {
  const { session } = Numi.useCheckout({});

  if (session.integration_client === IntegrationClient.STRIPE) {
    return (
      <StripeElementsComponent context={context} />
    );
  }
      return (
      <div>
        <h1>Other payment methods. e.g Plandalf</h1>
      </div>
    );
}

export default PaymentMethodBlock;
