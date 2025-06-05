import { CheckoutSession } from "@/types/checkout";
import { BaseEvent } from "./BaseEvent";

export class CheckoutSuccess extends BaseEvent {
  public type: string = 'checkout_success';
  public checkoutSession: CheckoutSession;

  constructor(checkoutSession: CheckoutSession) {
    super();
    this.checkoutSession = checkoutSession;
  }
}
