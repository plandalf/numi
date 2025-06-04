import { BaseEvent } from "./BaseEvent";

export class CheckoutInit extends BaseEvent {
  public type: string = 'checkout_init';
}
