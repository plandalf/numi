import { BaseEvent } from "./BaseEvent";
import { CheckoutSession } from '@/types/checkout';

export class CheckoutSubmit extends BaseEvent {
  public type: string = 'checkout_submit';
  public session: CheckoutSession;
  public checkoutId: string;
  public sessionId: string;

  constructor(session: CheckoutSession) {
    super('checkout_submit', {
      checkoutId: session.id,
      sessionId: session.id,
      session: session
    });
    this.session = session;
    this.checkoutId = session.id;
    this.sessionId = session.id;
  }
}