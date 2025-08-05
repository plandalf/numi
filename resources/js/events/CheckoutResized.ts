import { BaseEvent } from "./BaseEvent";

export class CheckoutResized extends BaseEvent {
  public type: string = 'form_resized';
  public size?: number;

  constructor(size?: number) {
    super('form_resized', {
      size: size
    });
    this.size = size;
  }
}
