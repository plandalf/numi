import { CheckoutSession } from "@/types/checkout";
import { BaseEvent } from "./BaseEvent";

export class CheckoutClosed extends BaseEvent {
  public type: string = 'close';
  public checkoutSession: CheckoutSession;
  public checkoutId: string;
  public sessionId: string;

  constructor(checkoutSession: CheckoutSession) {
    super('close', {
      checkoutId: checkoutSession.id,
      sessionId: checkoutSession.id,
      checkoutSession: checkoutSession
    });

    this.checkoutSession = checkoutSession;
    this.checkoutId = checkoutSession.id;
    this.sessionId = checkoutSession.id;
  }
}


