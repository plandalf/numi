/**
 * Payment Method Intelligence Service
 * 
 * Handles smart filtering of payment methods based on:
 * - Intent mode (payment vs setup/subscription)
 * - Provider-specific compatibility (Stripe, future providers)
 * - Amount limits for BNPL methods
 * - Currency/country support
 * - Business rules and restrictions
 * 
 * This service can be:
 * 1. Used on frontend for immediate UI feedback
 * 2. Implemented on backend for authoritative filtering
 * 3. Extended to support multiple payment providers
 */

export interface PaymentSession {
  enabled_payment_methods?: string[];
  intent_mode?: 'payment' | 'setup';
  has_subscription_items?: boolean;
  has_onetime_items?: boolean;
  has_mixed_cart?: boolean;
  total?: number;
  currency?: string;
  provider?: 'stripe' | 'paypal' | 'square'; // Future providers
}

export interface PaymentMethodFilterResult {
  paymentMethods: string[];
  wallets: { applePay: 'auto' | 'never'; googlePay: 'auto' | 'never' };
  hasRedirectMethods: boolean;
  filteringReasons: string[];
  intentMode: 'payment' | 'setup';
}

export interface PaymentMethodLimits {
  [method: string]: {
    [currency: string]: number; // Amount in cents
  };
}

export interface PaymentProviderConfig {
  name: string;
  nonRecurringMethods: string[];
  redirectMethods: string[];
  amountLimits: PaymentMethodLimits;
  walletMethods: string[];
}

/**
 * Stripe-specific configuration
 * This could be moved to a config file or backend
 */
const STRIPE_CONFIG: PaymentProviderConfig = {
  name: 'stripe',
  // Payment methods that don't support recurring/off-session payments
  nonRecurringMethods: [
    'klarna', 'afterpay_clearpay', 'affirm', 'zip', 'alipay', 'wechat_pay',
    'oxxo', 'boleto', 'konbini', 'paynow', 'promptpay'
  ],
  // Payment methods that require redirects
  redirectMethods: [
    'ideal', 'sofort', 'bancontact', 'giropay', 'eps', 'p24', 'alipay', 'wechat_pay',
    'klarna', 'afterpay_clearpay', 'affirm', 'fpx', 'grabpay', 'oxxo', 'boleto',
    'konbini', 'paynow', 'promptpay', 'zip', 'swish', 'twint', 'mb_way', 'multibanco',
    'blik', 'mobilepay', 'vipps', 'satispay'
  ],
  // BNPL and other methods with amount limits (in cents)
  amountLimits: {
    'afterpay_clearpay': { 
      'usd': 200000, 'cad': 250000, 'aud': 300000, 
      'nzd': 300000, 'gbp': 150000, 'eur': 180000 
    },
    'affirm': { 'usd': 175000, 'cad': 200000 },
    'klarna': { 
      'usd': 100000, 'eur': 100000, 'gbp': 80000, 
      'aud': 150000, 'cad': 120000 
    },
    'zip': { 'usd': 100000, 'aud': 150000 }
  },
  walletMethods: ['apple_pay', 'google_pay']
};

/**
 * Future provider configs can be added here
 * const PAYPAL_CONFIG: PaymentProviderConfig = { ... }
 * const SQUARE_CONFIG: PaymentProviderConfig = { ... }
 */

export class PaymentIntelligenceService {
  private config: PaymentProviderConfig;

  constructor(provider: string = 'stripe') {
    switch (provider) {
      case 'stripe':
        this.config = STRIPE_CONFIG;
        break;
      // Future cases:
      // case 'paypal': this.config = PAYPAL_CONFIG; break;
      // case 'square': this.config = SQUARE_CONFIG; break;
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  /**
   * Get available payment methods for the current checkout context
   * This is the main method that applies all filtering logic
   */
  getAvailableMethodsForContext(session: PaymentSession): PaymentMethodFilterResult {
    const enabledMethods = session.enabled_payment_methods || ['card'];
    const intentMode = this.determineIntentMode(session);
    const filteringReasons: string[] = [];
    
    let filteredMethods = [...enabledMethods];

    // Apply subscription compatibility filter
    if (this.isSubscriptionMode(session, intentMode)) {
      const { filtered, removed } = this.filterNonRecurringMethods(filteredMethods);
      filteredMethods = filtered;
      if (removed.length > 0) {
        filteringReasons.push(`${removed.join(', ')} (not available for subscriptions)`);
      }
    }

    // Apply amount limits for payment mode
    if (intentMode === 'payment' && session.total && session.total > 0) {
      const { filtered, removed } = this.filterByAmountLimits(
        filteredMethods, 
        session.total, 
        session.currency || 'usd'
      );
      filteredMethods = filtered;
      if (removed.length > 0) {
        filteringReasons.push(...removed);
      }
    }

    // Separate payment methods and wallets
    const paymentMethods = filteredMethods.filter(method => 
      !this.config.walletMethods.includes(method)
    );

    const wallets = {
      applePay: enabledMethods.includes('apple_pay') ? 'auto' as const : 'never' as const,
      googlePay: enabledMethods.includes('google_pay') ? 'auto' as const : 'never' as const,
    };

    const hasRedirectMethods = paymentMethods.some(method => 
      this.config.redirectMethods.includes(method)
    );

    console.log('Payment Intelligence Results:', {
      provider: this.config.name,
      originalMethods: enabledMethods,
      filteredMethods: paymentMethods,
      intentMode,
      hasSubscription: session.has_subscription_items,
      total: session.total,
      currency: session.currency,
      filteringReasons,
      hasRedirectMethods
    });

    return { 
      paymentMethods, 
      wallets, 
      hasRedirectMethods, 
      filteringReasons, 
      intentMode 
    };
  }

  /**
   * Determine the intent mode based on session contents
   */
  private determineIntentMode(session: PaymentSession): 'payment' | 'setup' {
    // Explicit intent mode takes precedence
    if (session.intent_mode) {
      return session.intent_mode;
    }
    
    // Auto-detect based on cart contents
    return session.has_subscription_items ? 'setup' : 'payment';
  }

     /**
    * Check if this is a subscription-based checkout
    */
   private isSubscriptionMode(session: PaymentSession, intentMode: 'payment' | 'setup'): boolean {
     return intentMode === 'setup' || Boolean(session.has_subscription_items);
   }

  /**
   * Filter out methods that don't support recurring payments
   */
  private filterNonRecurringMethods(methods: string[]): { filtered: string[]; removed: string[] } {
    const filtered: string[] = [];
    const removed: string[] = [];

    methods.forEach(method => {
      if (this.config.nonRecurringMethods.includes(method)) {
        removed.push(method);
      } else {
        filtered.push(method);
      }
    });

    return { filtered, removed };
  }

  /**
   * Filter payment methods by amount limits
   * BNPL methods have different limits per currency
   */
  private filterByAmountLimits(
    methods: string[], 
    totalInCents: number, 
    currency: string
  ): { filtered: string[]; removed: string[] } {
    const filtered: string[] = [];
    const removed: string[] = [];
    const currencyLower = currency.toLowerCase();

    const formatCurrency = (amount: number) => {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency.toUpperCase(),
        }).format(amount / 100);
      } catch {
        return `${amount / 100} ${currency.toUpperCase()}`;
      }
    };

    methods.forEach(method => {
      const methodLimits = this.config.amountLimits[method];
      if (!methodLimits) {
        filtered.push(method);
        return;
      }
      
      const limit = methodLimits[currencyLower];
      if (!limit) {
        filtered.push(method);
        return;
      }
      
      if (totalInCents <= limit) {
        filtered.push(method);
      } else {
        removed.push(`${method} (max ${formatCurrency(limit)})`);
      }
    });

    return { filtered, removed };
  }

  /**
   * Get user-friendly filtering information for display
   */
  getFilteringInfo(session: PaymentSession): {
    limitMessages: string[];
    intentModeInfo: string | null;
    availableMethods: string[];
    intentMode: 'payment' | 'setup';
  } {
    const { paymentMethods, filteringReasons, intentMode } = this.getAvailableMethodsForContext(session);
    
    let intentModeInfo: string | null = null;
    if (this.isSubscriptionMode(session, intentMode)) {
      intentModeInfo = 'Subscription mode: Only payment methods that support recurring payments are available';
    }

    return {
      limitMessages: filteringReasons,
      intentModeInfo,
      availableMethods: paymentMethods,
      intentMode
    };
  }

     /**
    * Determine if checkout has mixed cart (one-time + subscription)
    */
   hasMixedCart(session: PaymentSession): boolean {
     return Boolean(session.has_mixed_cart) || 
            (Boolean(session.has_subscription_items) && Boolean(session.has_onetime_items));
   }

  /**
   * Check if a specific payment method is available for the session
   * Useful for backend validation
   */
  isMethodAvailable(method: string, session: PaymentSession): boolean {
    const { paymentMethods, wallets } = this.getAvailableMethodsForContext(session);
    return paymentMethods.includes(method) || 
           (method === 'apple_pay' && wallets.applePay === 'auto') ||
           (method === 'google_pay' && wallets.googlePay === 'auto');
  }

  /**
   * Get the provider configuration (useful for debugging)
   */
  getProviderConfig(): PaymentProviderConfig {
    return this.config;
  }
}

/**
 * Factory function for creating payment intelligence service
 * This makes it easy to swap providers or add provider-specific logic
 */
export function createPaymentIntelligence(provider: string = 'stripe'): PaymentIntelligenceService {
  return new PaymentIntelligenceService(provider);
}

/**
 * Default instance for backwards compatibility
 */
export const paymentIntelligence = createPaymentIntelligence('stripe'); 