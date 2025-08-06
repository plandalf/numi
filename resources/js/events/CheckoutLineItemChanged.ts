import { CheckoutSession } from "@/types/checkout";
import { BaseEvent } from "./BaseEvent";

export class CheckoutLineItemChanged extends BaseEvent {
  public type: string = 'checkout_lineitem_changed';
  public checkoutSession: CheckoutSession;
  public checkoutId: string;
  public sessionId: string;
  public lineItems: any[];
  public changeType: 'added' | 'removed' | 'quantity_changed' | 'price_changed';
  public changedItem?: any;
  public newTotal?: number;
  public currency?: string;

  constructor(checkoutSession: CheckoutSession, changeType: 'added' | 'removed' | 'quantity_changed' | 'price_changed', changedItem?: any) {
    const lineItems = checkoutSession.line_items || [];
    const newTotal = checkoutSession.total;
    const currency = checkoutSession.currency || 'USD';

    super('checkout_lineitem_changed', {
      checkoutId: checkoutSession.id,
      sessionId: checkoutSession.id,
      changeType: changeType,
      changedItem: changedItem,
      lineItems: lineItems,
      newTotal: newTotal,
      currency: currency,
      checkoutSession: checkoutSession
    });
    
    this.checkoutSession = checkoutSession;
    this.checkoutId = checkoutSession.id;
    this.sessionId = checkoutSession.id;
    this.changeType = changeType;
    this.changedItem = changedItem;
    this.lineItems = lineItems;
    this.newTotal = newTotal;
    this.currency = currency;
  }
}