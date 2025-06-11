import { BaseEvent } from "./BaseEvent";

export class PaymentInitialized extends BaseEvent {
  public type: string = 'payment_init';
}
