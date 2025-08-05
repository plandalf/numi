import { CheckoutSession } from "@/types/checkout";
import { BaseEvent } from "./BaseEvent";

export class CheckoutComplete extends BaseEvent {
  public type: string = 'checkout_complete';
  public checkoutSession: CheckoutSession;
  public orderNumber?: string;
  public total?: number;
  public currency?: string;
  public checkoutId: string;
  public sessionId: string;
  public subscriptionId?: string;
  public planName?: string;

  constructor(checkoutSession: CheckoutSession) {
    const orderNumber = checkoutSession.order?.order_number || checkoutSession.order?.id;
    const total = checkoutSession.order?.total || checkoutSession.total;
    const currency = checkoutSession.order?.currency || checkoutSession.currency || 'USD';
    const subscriptionId = checkoutSession.order?.subscription_id;
    const planName = checkoutSession.offer?.name;

    super('checkout_complete', {
      checkoutId: checkoutSession.id,
      sessionId: checkoutSession.id,
      orderNumber: orderNumber,
      total: total,
      currency: currency,
      subscriptionId: subscriptionId,
      planName: planName,
      checkoutSession: checkoutSession
    });
    
    this.checkoutSession = checkoutSession;
    this.orderNumber = orderNumber;
    this.total = total;
    this.currency = currency;
    this.subscriptionId = subscriptionId;
    this.planName = planName;
    this.checkoutId = checkoutSession.id;
    this.sessionId = checkoutSession.id;
  }
}