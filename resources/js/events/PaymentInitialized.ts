import { BaseEvent } from "./BaseEvent";
import { CheckoutSession } from '@/types/checkout';

export class PaymentInitialized extends BaseEvent {
  public type: string = 'payment_init';
  public session: CheckoutSession;
  public checkoutId: string;
  public sessionId: string;

  constructor(session: CheckoutSession) {
    super('payment_init', {
      checkoutId: session.id,
      sessionId: session.id,
      session: session
    });
    this.session = session;
    this.checkoutId = session.id;
    this.sessionId = session.id;
  }
}
