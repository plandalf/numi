import { BaseEvent } from "./BaseEvent";
import { CheckoutSession } from '@/types/checkout';

export class OnInit extends BaseEvent {
  public type: string = 'on_init';
  public session: CheckoutSession;

  constructor(session) {
    super();
    this.session = session;
  }
}
