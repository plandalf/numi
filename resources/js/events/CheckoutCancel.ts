import { CheckoutSession } from "@/types/checkout";
import { BaseEvent } from "./BaseEvent";

export class CheckoutCancel extends BaseEvent {
  public type: string = 'checkout_cancel';
  public checkoutSession?: CheckoutSession;
  public checkoutId: string;
  public sessionId: string;
  public cancelReason?: string;
  public currentPage?: string;
  public timeSpent?: number;

  constructor(checkoutSession: CheckoutSession, cancelReason?: string) {
    const timeSpent = checkoutSession.created_at ? 
      Date.now() - new Date(checkoutSession.created_at).getTime() : 
      undefined;

    super('checkout_cancel', {
      checkoutId: checkoutSession.id,
      sessionId: checkoutSession.id,
      cancelReason: cancelReason || 'user_closed',
      currentPage: checkoutSession.current_page_id,
      timeSpent: timeSpent,
      checkoutSession: checkoutSession
    });
    
    this.checkoutSession = checkoutSession;
    this.checkoutId = checkoutSession.id;
    this.sessionId = checkoutSession.id;
    this.cancelReason = cancelReason || 'user_closed';
    this.currentPage = checkoutSession.current_page_id;
    this.timeSpent = timeSpent;
  }
}