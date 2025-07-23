import Numi, { Appearance, FontValue, Style } from "@/contexts/Numi";
import React, { useState, useEffect, useRef, useMemo, useCallback, CSSProperties } from "react";
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useCheckoutState } from "@/pages/checkout-main";
import { resolveThemeValue } from "@/lib/theme";
import { addAlphaToColor } from "../ui/color-picker";
import { MarkdownText } from "../ui/markdown-text";
import { buildGoogleFontsUrl, getFontsFromStyle } from "@/utils/font-finder";
import { usePage } from "@inertiajs/react";
import { Font } from "@/types";
import axios from "@/lib/axios";
import { paymentIntelligence, PaymentSession } from "@/lib/payment-intelligence";
import { BaseEvent } from '@/events/BaseEvent';

// Define the type for the checkout state
interface CheckoutState {
  setPageSubmissionProps: (props: (() => Promise<any>) | null) => void;
}

// Convert session to PaymentSession interface for the intelligence service
function toPaymentSession(session: any): PaymentSession {
  return {
    enabled_payment_methods: session.enabled_payment_methods,
    intent_mode: session.intent_mode,
    has_subscription_items: session.has_subscription_items,
    has_onetime_items: session.has_onetime_items,
    has_mixed_cart: session.has_mixed_cart,
    total: session.total,
    currency: session.currency,
    provider: 'stripe'
  };
}

// Abstracted Email Input Component - Memoized to prevent re-renders
const EmailInput = React.memo(({
  value,
  onChange,
  style,
  theme,
  inputLabelFont,
  inputTextFont,
  inputBackgroundColor,
  inputBorderColor,
  inputBorder,
  inputBorderRadius,
  inputPadding
}: {
  value: string;
  onChange: (email: string) => void;
  style?: CSSProperties;
  theme: Record<string, unknown>;
  inputLabelFont: FontValue;
  inputTextFont: FontValue;
  inputBackgroundColor: string;
  inputBorderColor: string;
  inputBorder: { width?: string; style?: string };
  inputBorderRadius: string;
  inputPadding: string;
}) => {
  // Memoize the onChange handler to prevent re-renders
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // console.log('JIT: Email input onChange:', e.target.value);
    onChange(e.target.value);
  }, [onChange]);

  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // console.log('JIT: Email input focused, current value:', e.target.value);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    // console.log('JIT: Email input blurred, final value:', e.target.value);
  }, []);

  // Memoize the input styles to prevent recalculation
  const inputStyles = useMemo(() => ({
    padding: inputPadding != '' ? inputPadding : '0.5rem',
    color: resolveThemeValue(inputTextFont?.color, theme),
    backgroundColor: resolveThemeValue(inputBackgroundColor, theme),
    fontFamily: inputTextFont?.font,
    fontWeight: inputTextFont?.weight,
    fontSize: inputTextFont?.size,
    lineHeight: inputTextFont?.lineHeight,
    borderColor: resolveThemeValue(inputBorderColor, theme),
    borderWidth: inputBorder?.width ?? '0.5px',
    borderStyle: inputBorder?.style,
    borderRadius: inputBorderRadius
  }), [inputPadding, inputTextFont, theme, inputBackgroundColor, inputBorderColor, inputBorder, inputBorderRadius]);

  const labelStyles = useMemo(() => ({
    color: resolveThemeValue(inputLabelFont?.color, theme),
    fontFamily: inputLabelFont?.font,
    fontWeight: inputLabelFont?.weight,
    fontSize: inputLabelFont?.size,
    lineHeight: inputLabelFont?.lineHeight,
    letterSpacing: inputLabelFont?.letterSpacing,
  }), [inputLabelFont, theme]);

  return (
    <div className='flex flex-col' style={style}>
      <label htmlFor="checkout-email" style={labelStyles}>Email</label>
      <div className="flex flex-row w-full">
        <input
          id={'checkout-email'}
          className="border border-gray-300 rounded-md p-2 w-full"
          type="email"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={inputStyles}
        />
      </div>
    </div>
  );
});

function StripeElementsComponent({
  onSuccess,
  emailAddress: externalEmailAddress,
  onEmailChange: externalOnEmailChange
}: {
  onSuccess?: () => void;
  emailAddress?: string;
  onEmailChange?: (email: string) => void;
}) {
  const { session, isEditor } = Numi.useCheckout({});
  const pageProps = usePage().props as any;
  const fonts = pageProps.fonts as Font[] || [];

  const theme = Numi.useTheme();
  const [stripePromise, setStripePromise] = useState<Stripe | null>(null);

  // Stripe component initialized

  const [title] = Numi.useStateString({
    label: 'Title',
    name: 'title',
    defaultValue: 'Payment Information',
    inspector: 'multiline',
    format: 'markdown',
  });

  const [collectsEmail] = Numi.useStateBoolean({
    label: 'Collect Email',
    name: 'collectsEmail',
    defaultValue: true,
  });

  // Determine if we should show email field
  // Show email if collectsEmail is true OR if there's an existing payment method (user wants to change it)
  const shouldShowEmail = collectsEmail || !!session?.payment_method;

  const [description] = Numi.useStateString({
    label: 'Description',
    name: 'description',
    defaultValue: 'Enter your payment details to complete your purchase',
    inspector: 'multiline',
    format: 'markdown',
  });

  const fontConfig = {
    config: {
      hideVerticalAlignment: true,
      hideHorizontalAlignment: true,
    },
  };

  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {
      options: {
        start: 'start',
        center: 'center',
        end: 'end',
        expand: 'expand',
      },
    }, 'expand'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, 'transparent'),
    Style.font('titleTextFont', 'Title Font && Color',fontConfig, {}),
    Style.font('descriptionTextFont', 'Description Font & Color', fontConfig, {}),

    Style.textColor('iconColor', 'Icon Color', {}, theme?.highlight_color),
    // Input
    Style.font( 'inputLabelFont', 'Input Label Font & Color', fontConfig, theme?.label_typography as FontValue),
    Style.backgroundColor('inputBackgroundColor', 'Input Background Color', {}, '#FFFFFF'),
    Style.font('inputTextFont', 'Input Text Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),

    Style.border('inputBorder', 'Input Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('inputBorderRadius', 'Input Border Radius', {}, theme?.border_radius),
    Style.borderColor('inputBorderColor', 'Input Border Color', {}, theme?.primary_border_color),

    Style.font( 'paymentFormLabelFont', 'Payment Form Label Font & Color', {
      ...fontConfig,
      config: {
        ...fontConfig.config,
        hideLetterSpacing: true,
      }
    }, theme?.label_typography as FontValue),
    Style.backgroundColor('paymentFormBackgroundColor', 'Payment Form Background Color', {}, 'transparent'),
    Style.borderRadius('paymentFormBorderRadius', 'Payment Form Border Radius', {}, theme?.border_radius),
    Style.border('paymentFormBorder', 'Payment Form Border', {}, { width: '0px', style: 'none' }),
    Style.borderColor('paymentFormBorderColor', 'Payment Form Border Color', {}, theme?.secondary_border_color),

    Style.alignment('paymentFormAlignment', 'Payment Form Alignment', {
      options: {
        start: 'start',
        center: 'center',
        end: 'end',
        expand: 'expand',
      },
    }, 'expand'),

    Style.font('termsTextFont', 'Terms Text Font & Color',fontConfig, theme?.body_typography as FontValue),

    // Error panel
    Style.backgroundColor('errorBackgroundColor', 'Error Background Color', {}, '#ffc9c9'),
    Style.font('errorTextFont', 'Error Text Font & Color',
      fontConfig,
      {
        color: '#c10007',
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.border('errorBorder', 'Error Border', {}, { width: '1px', style: 'solid' }),
    Style.borderColor('errorBorderColor', 'Error Border Color', {}, '#ffc9c9'),

    // Warning panel
    Style.backgroundColor('warningBackgroundColor', 'Warning Background Color', {}, addAlphaToColor(theme?.warning_color, 0.10)),
    Style.font('warningTextFont', 'Warning Text Font & Color',
      fontConfig,
      {
        color: theme?.warning_color,
      },
    ),
    Style.border('warningBorder', 'Warning Border', {}, { width: '1px', style: 'solid' }),
    Style.borderColor('warningBorderColor', 'Warning Border Color', {}, theme?.warning_color),
    Style.border('border', 'Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, theme?.border_radius),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, theme?.shadow),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.padding('inputPadding', 'Input Padding', {}),
    Appearance.padding('paymentFormPadding', 'Payment Form Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const containerStyle = useMemo(() => ({
    ...style.alignment != 'expand' ? { alignItems: style.alignment } : {},
    width: style.alignment == 'expand' ? '100%' : 'auto',
    backgroundColor: resolveThemeValue(style.backgroundColor, theme),
    padding:appearance.padding,
    margin: appearance.margin,
    gap: appearance.spacing,
  }), [style, appearance]);

  const paymentFormStyle = useMemo(() => ({
    ...style.paymentFormAlignment != 'expand' ? { alignItems: style.paymentFormAlignment } : {},
    width: '100%',
    backgroundColor: resolveThemeValue(style.paymentFormBackgroundColor, theme),
    padding:appearance.paymentFormPadding,
    borderColor: resolveThemeValue(style.paymentFormBorderColor, theme),
    borderWidth: style.paymentFormBorder?.width,
    borderStyle: style.paymentFormBorder?.style,
    borderRadius : style.paymentFormBorderRadius,

  }), [style, appearance]);

  const titleStyle = useMemo(() => ({
    color: resolveThemeValue(style?.titleTextFont?.color, theme),
    fontFamily: style?.titleTextFont?.font,
    fontSize: style?.titleTextFont?.size,
    fontWeight: style?.titleTextFont?.weight,
    lineHeight: style?.titleTextFont?.lineHeight,
    letterSpacing: style?.titleTextFont?.letterSpacing,
  }), [style]);

  const descriptionStyle = useMemo(() => ({
    color: resolveThemeValue(style?.descriptionTextFont?.color, theme),
    fontFamily: style?.descriptionTextFont?.font,
    fontSize: style?.descriptionTextFont?.size,
    fontWeight: style?.descriptionTextFont?.weight,
    lineHeight: style?.descriptionTextFont?.lineHeight,
    letterSpacing: style?.descriptionTextFont?.letterSpacing,
  }), [style]);

  const errorPanelStyle = useMemo(() => ({
    backgroundColor: resolveThemeValue(style?.errorBackgroundColor, theme),
    color: resolveThemeValue(style?.errorTextFont?.color, theme),
    fontFamily: style.errorTextFont?.font,
    fontSize: style.errorTextFont?.size,
    fontWeight: style.errorTextFont?.weight,
    lineHeight: style.errorTextFont?.lineHeight,
    letterSpacing: style.errorTextFont?.letterSpacing,
    borderColor: resolveThemeValue(style?.errorBorderColor, theme),
    borderWidth: style.errorBorder?.width,
    borderStyle: style.errorBorder?.style,
    borderRadius : style.errorBorderRadius ?? '3px',
  }), [style]);

  const warningColor = resolveThemeValue(style.warningBackgroundColor, theme, 'warning_color') as string;
  const warningColorWithAlpha = addAlphaToColor(warningColor, 0.10);
  const warningPanelStyle = useMemo(() => ({
    backgroundColor: style?.warningBackgroundColor ? resolveThemeValue(style?.warningBackgroundColor, theme) : warningColorWithAlpha,
    color: resolveThemeValue(style?.warningTextFont?.color, theme),
    fontFamily: style.warningTextFont?.font,
    fontSize: style.warningTextFont?.size,
    fontWeight: style.warningTextFont?.weight,
    lineHeight: style.warningTextFont?.lineHeight,
    letterSpacing: style.warningTextFont?.letterSpacing,
    borderColor: resolveThemeValue(style?.warningBorderColor, theme),
    borderWidth: style.warningBorder?.width,
    borderStyle: style.warningBorder?.style,
    borderRadius: style.warningBorderRadius ?? '3px',
  }), [style, warningColor, warningColorWithAlpha]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializationAttempted = useRef(false);
  const [stripeError, setStripeError] = useState(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    async function initializeStripe() {
      if (initializationAttempted.current) return;
      initializationAttempted.current = true;

      try {
        if (!session.publishable_key) {
          throw new Error('Stripe publishable key is missing');
        }

        console.log('JIT: Initializing Stripe with key:', session.publishable_key.substring(0, 20) + '...');

        const stripe = await loadStripe(session.publishable_key);
        if (!stripe) {
          throw new Error('Failed to load Stripe - loadStripe returned null');
        }

        console.log('JIT: Stripe loaded successfully');
        setStripePromise(stripe);
      } catch (error: any) {
        console.error('JIT: Stripe initialization error:', error);
        const errorMessage = error.message || 'Unknown Stripe initialization error';
        setStripeError(errorMessage);

        // Log additional context
        console.error('JIT: Stripe initialization context:', {
          hasSession: !!session,
          sessionId: session?.id,
          hasPublishableKey: !!session?.publishable_key,
          keyPrefix: session?.publishable_key?.substring(0, 20),
          errorType: error.constructor.name,
          errorStack: error.stack
        });
      }

      setIsLoading(false)
    }

    initializeStripe();
  }, [session.publishable_key]);

  const [internalEmailAddress, setInternalEmailAddress] = useState('');

  // Use external email if provided, otherwise use internal state
  const emailAddress = externalEmailAddress !== undefined ? externalEmailAddress : internalEmailAddress;

  // Memoize the email change handler to prevent re-renders
  const handleEmailChange = useMemo(() => (email: string) => {
    setInternalEmailAddress(email);
    if (externalOnEmailChange) {
      externalOnEmailChange(email);
    }
  }, [externalOnEmailChange]);

  // Initialize email from session if available (only for internal state)
  useEffect(() => {
    if (externalEmailAddress === undefined && !internalEmailAddress) {
      // Try to get email from various sources in order of preference
      const sessionEmail = session.properties?.email
        || session.customer?.email
        || session.payment_method?.billing_details?.email;

      if (sessionEmail) {
        setInternalEmailAddress(sessionEmail);
      }
    }
  }, [session.properties?.email, session.customer?.email, session.payment_method?.billing_details?.email, externalEmailAddress, internalEmailAddress]);

  const googleFontsUrl = useMemo(() => {
    const uniqueFonts = !isEditor
      ? fonts .filter(f => ['Inter', ...getFontsFromStyle(style)].includes(f.name))
      : fonts;

    return buildGoogleFontsUrl(uniqueFonts);
  }, [style, isEditor, fonts]);

  const inputLabelFont = {
    ...resolveThemeValue(style?.inputLabelFont, theme, 'label_typography') as FontValue,
    color: resolveThemeValue(style?.inputLabelFont?.color, theme),
  } as FontValue;

  const stripeElementAppearance = useMemo(() => {
    const termsTextFont = {
      ...resolveThemeValue(style?.termsTextFont, theme, 'body_typography') as FontValue,
      color: resolveThemeValue(style?.termsTextFont?.color, theme),
    } as FontValue;

    const paymentFormLabelFont = {
      ...resolveThemeValue(style?.paymentFormLabelFont, theme, 'label_typography') as FontValue,
      color: resolveThemeValue(style?.paymentFormLabelFont?.color, theme),
    } as FontValue;

    return {
      variables: {
        'spacingUnit': appearance.spacing,
        'colorPrimary': paymentFormLabelFont?.color,
        'fontFamily': paymentFormLabelFont?.font,
        'fontSizeBase': paymentFormLabelFont?.size,
        'fontWeightLight': style.paymentFormLabelFont?.weight,
        'fontWeightNormal': style.paymentFormLabelFont?.weight,
        'fontWeightMedium': style.paymentFormLabelFont?.weight,
        'fontWeightBold': style.paymentFormLabelFont?.weight,
        'fontLineHeight': style.paymentFormLabelFont?.lineHeight,
        'letterSpacing': style.paymentFormLabelFont?.letterSpacing,
        'iconChevronDownColor': style?.iconColor,
        'iconCardCvcColor': style?.iconColor,
      },
      rules: {
        '.Text': {
          color: 'red'
        },
        '.TabIcon': {
          color: style?.iconColor,
        },
        '.AccordionItem': {
          // boxShadow: 'none',
          // borderRadius: paymentFormStyle.borderRadius,
          // backgroundColor: paymentFormStyle.backgroundColor,
          // borderWidth: '0px',
          // borderStyle: 'none',
          // margin: '0px',
          // padding: '2px',
        },
        '.Label': {
          color: inputLabelFont?.color,
          fontFamily: inputLabelFont?.font,
          fontWeight: inputLabelFont?.weight,
          fontSize: inputLabelFont?.size,
          lineHeight: inputLabelFont?.lineHeight,
          letterSpacing: inputLabelFont?.letterSpacing,

        },
        '.TermsText': {
          color: termsTextFont?.color,
          fontFamily: termsTextFont?.font,
          fontWeight: termsTextFont?.weight,
          fontSize: termsTextFont?.size,
          lineHeight: termsTextFont?.lineHeight,
          letterSpacing: termsTextFont?.letterSpacing,
        },
        '.Input': {
          padding: appearance.inputPadding != '' ? appearance.inputPadding : '0.5rem',
          color: resolveThemeValue(style.inputTextFont?.color, theme),
          backgroundColor: resolveThemeValue(style.inputBackgroundColor, theme),
          fontFamily: style.inputTextFont?.font,
          fontWeight: style.inputTextFont?.weight,
          fontSize: style.inputTextFont?.size,
          lineHeight: style.inputTextFont?.lineHeight,
          borderColor: resolveThemeValue(style.inputBorderColor, theme),
          borderWidth: style.inputBorder?.width ?? '0.5px',
          borderStyle: style.inputBorder?.style,
          borderRadius : style.inputBorderRadius
        },
        '.Input--invalid': {
          borderColor: errorPanelStyle.borderColor,
          boxShadow: `0 1px 1px 0 rgba(0, 0, 0, 0.07), 0 0 0 2px ${errorPanelStyle.borderColor}`,
          fontFamily: errorPanelStyle.fontFamily,
          fontSize: errorPanelStyle.fontSize,
          fontWeight: errorPanelStyle.fontWeight,
          lineHeight: errorPanelStyle.lineHeight,
          letterSpacing: errorPanelStyle.letterSpacing,
          borderWidth: errorPanelStyle.borderWidth,
          borderStyle: errorPanelStyle.borderStyle,
          borderRadius : errorPanelStyle.borderRadius,
        },
        '.Input--invalid:focus': {
          color: errorPanelStyle.color,
          borderColor: errorPanelStyle.borderColor,
          boxShadow: `0 1px 1px 0 rgba(0, 0, 0, 0.07), 0 0 0 2px ${errorPanelStyle.borderColor}`,
        },
        '.Input:focus': {
          borderColor: resolveThemeValue(style.inputBorderColor, theme),
          boxShadow:  `0 0 0 3px ${resolveThemeValue(style.inputBorderColor, theme)}20`,
        },
        // '.PaymentMethodSelector': {
        //   borderRadius: style.inputBorderRadius,
        // },
        '.PaymentMethodSelectorTab': {
          borderRadius: style.inputBorderRadius,
          borderColor: resolveThemeValue(style.inputBorderColor, theme),
          color: resolveThemeValue(style.inputTextFont?.color, theme),
          backgroundColor: resolveThemeValue(style.inputBackgroundColor, theme),
        },
        // '.PaymentMethodSelectorTab--selected': {
        //   borderColor: resolveThemeValue(style.inputBorderColor, theme),
        //   backgroundColor: resolveThemeValue(style.paymentFormBackgroundColor, theme),
        // },
        // '.WalletButton': {
        //   borderRadius: style.inputBorderRadius,
        //   height: '48px',
        // },
      }
    }
  }, [style, appearance,theme, containerStyle, errorPanelStyle]);

  // Memoize payment intelligence results to prevent frequent recalculations
  const paymentIntelligenceResults = useMemo(() => {
    if (!session || !session.currency || session.total === undefined) {
      return null;
    }

    const paymentSession = toPaymentSession(session);
    return paymentIntelligence.getAvailableMethodsForContext(paymentSession);
  }, [session?.currency, session?.total, session?.enabled_payment_methods, session?.intent_mode, session?.has_subscription_items, session?.has_onetime_items, session?.has_mixed_cart]);

  // JIT: Configure Stripe Elements in deferred mode (no client_secret needed)
  const stripeOptions = useMemo(() => {

    // Don't initialize if session is not properly loaded
    if (!session || !session.currency || session.total === undefined) {
      console.warn('JIT: Stripe initialization failed - missing required session properties:', {
        hasSession: !!session,
        currency: session?.currency,
        total: session?.total,
      });
      return null;
    }

    // Use memoized payment intelligence results
    if (!paymentIntelligenceResults) {
      return null;
    }

    const {
      paymentMethods,
      wallets,
      hasRedirectMethods,
      intentMode
    } = paymentIntelligenceResults;

    // JIT: Configure deferred mode without client_secret
    const options: any = {
      mode: intentMode,
      currency: session.currency.toLowerCase(),
      appearance: stripeElementAppearance,
      fonts: [{
        cssSrc: googleFontsUrl,
      }],
      paymentMethodTypes: paymentMethods.length > 0 ? paymentMethods : ['card'],
    };

    // Add amount for payment mode (required by Stripe in deferred mode)
    if (intentMode === 'payment') {
      const amountInCents = session.total || 0;

      if (amountInCents <= 0) {
        options.mode = 'setup';
        delete options.amount;
      } else {
        options.amount = amountInCents;
      }
    }

    return options;
  }, [session, stripeElementAppearance, googleFontsUrl, paymentIntelligenceResults]);

  // Get payment method filtering info for UI display - memoized
  const paymentSessionForFiltering = useMemo(() => toPaymentSession(session), [session]);
  const { limitMessages, intentModeInfo, availableMethods } = useMemo(() => {
    return paymentIntelligence.getFilteringInfo(paymentSessionForFiltering)
  }, [paymentSessionForFiltering]);

  class MessageEvent extends BaseEvent{
    public type: string = 'numi_embed_message';
  }

  function handleTestPost() {
    window.parent.postMessage(new MessageEvent('numi_embed_message', {
      url: 'http://example.com/test',
    }), '*');

    // this will force
  }

  if (style.hidden) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4" style={containerStyle}>
      <button onClick={handleTestPost} type={"button"}>TEST POST</button>

      {title && (<MarkdownText theme={theme} text={title} style={titleStyle} />)}
      {description && (<MarkdownText theme={theme} text={description} style={descriptionStyle} />)}

      {shouldShowEmail && (
        <EmailInput
          value={emailAddress}
          onChange={handleEmailChange}
          appearance={appearance}
          theme={theme}
          inputLabelFont={inputLabelFont}
          inputTextFont={style.inputTextFont}
          inputBackgroundColor={style.inputBackgroundColor}
          inputBorderColor={style.inputBorderColor}
          inputBorder={style.inputBorder}
          inputBorderRadius={style.inputBorderRadius}
          inputPadding={appearance.inputPadding}
        />
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" style={errorPanelStyle}>
          {error}
        </div>
      ) : stripePromise && stripeOptions && !session?.intent_state?.blocked ? (
        <>
          {/* Check if payment is already confirmed */}
          {session?.intent_state?.payment_confirmed ? (
            <div style={{
              padding: '16px',
              backgroundColor: '#f0f9ff',
              border: '1px solid #0ea5e9',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <svg className="w-6 h-6 mr-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#0f766e' }}>
                  Payment Already Confirmed
                </span>
              </div>

              <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5' }}>
                <p style={{ marginBottom: '8px' }}>
                  Your payment has been successfully processed and confirmed.
                </p>

                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: 'monospace'
                }}>
                  <div><strong>Status:</strong> {session.intent_state.intent_status}</div>
                  <div><strong>Intent Type:</strong> {session.intent_state.intent_type}</div>
                  <div><strong>Intent ID:</strong> {session.intent_state.intent_id}</div>
                  {session.intent_state.amount && (
                    <div><strong>Amount:</strong> ${(session.intent_state.amount / 100).toFixed(2)} {session.intent_state.currency?.toUpperCase()}</div>
                  )}
                </div>

                <p style={{ marginTop: '12px', fontSize: '13px', color: '#6b7280' }}>
                  You can now proceed with your order. The payment method has been saved for future use.
                </p>
              </div>
            </div>
          ) : (
            <Elements
              stripe={stripePromise}
              options={stripeOptions}>
              <PaymentForm
                style={paymentFormStyle}
                emailAddress={emailAddress || ''}
                onEmailChange={handleEmailChange}
                collectsEmail={shouldShowEmail}
                sessionId={session.id}
                onSuccess={onSuccess}
              />
            </Elements>
          )}
        </>
      ) : (
       <div></div>
      )}
    </div>
  );
}

// JIT: Enhanced PaymentForm with two-step commit process
function PaymentForm({
  style,
  emailAddress,
  onEmailChange,
  collectsEmail,
  sessionId,
  onSuccess
}: {
  style?: CSSProperties;
  emailAddress: string;
  onEmailChange: (email: string) => void;
  collectsEmail: boolean;
  sessionId: string|number;
  onSuccess?: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { setPageSubmissionProps } = useCheckoutState() as CheckoutState;

  const { session, submitPage } = Numi.useCheckout();
  const [paymentType, setPaymentType] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugMessages, setDebugMessages] = useState<string[]>([]);
  const [debugMode] = useState(true); // Enable debug mode by default
  const [currentStep, setCurrentStep] = useState<string>('');
  const [stepData, setStepData] = useState<Record<string, unknown> | null>(null);
  const [waitingForApproval, setWaitingForApproval] = useState(false);

  // Payment method memory state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [fallbackPaymentMethod] = useState<string>('card');



  // Handle payment method change with memory - memoized to prevent re-renders
  const handlePaymentMethodChange = useCallback((evt: { value?: { type?: string } }) => {
    const newMethod = evt.value?.type || '';
    setPaymentType(newMethod);
    if (newMethod) {
      console.log('JIT: Selected payment type:', newMethod, evt);
    }
  }, []);

  // Handle backend payment method rejection
  const handlePaymentMethodRejection = (rejectedMethod: string, supportedMethods: string[]) => {

    // Find a fallback method from supported methods
    const fallback = supportedMethods.includes('card') ? 'card' :
                    supportedMethods.includes('link') ? 'link' :
                    supportedMethods[0] || 'card';

    setFallbackPaymentMethod(fallback);
    setPaymentType(fallback);

    // Show user notification
    setError(`The selected payment method (${rejectedMethod}) is not available. We've switched to ${fallback}.`);

    // Clear error after 5 seconds
    setTimeout(() => {
      setError(null);
    }, 5000);
  };

  // Check intent state on component mount
  useEffect(() => {
    if (session?.intent_state) {
      const { blocked, reason, intent_status, payment_confirmed } = session.intent_state;

      if (blocked) {
        setError(`Payment blocked: ${reason}`);
        addDebugMessage(`Intent state check: ${intent_status} - ${reason}`);
      } else if (payment_confirmed) {
        addDebugMessage(`Payment already confirmed: ${intent_status}`);
      } else {
        addDebugMessage(`Intent state: ${intent_status} - can proceed`);
      }
    }
  }, [session?.intent_state]);

  const addDebugMessage = (message: string) => {
    setDebugMessages(prev => [...prev.slice(-4), `${new Date().toISOString().slice(11, 23)}: ${message}`]);
  };

  // Helper function to wait for user approval in debug mode
  const waitForApproval = async (step: string, data?: any): Promise<void> => {
    if (!debugMode) return;

    setCurrentStep(step);
    setStepData(data);
    setWaitingForApproval(true);

    return new Promise((resolve) => {
      (window as any).__debugApprovalResolve = resolve;
    });
  };

  const RETURN_STRIPE_NOT_INITIALIZED =  {
    error: 'Stripe has not been initialized',
    type: 'validation_error',
    code: 'stripe_not_initialized',
  };

  const RETURN_EMAIL_REQUIRED = {
    error: 'Email is required',
    type: 'validation_error',
    code: 'email_required',
  }
  const RETURN_EMAIL_INVALID = {
    error: 'Please enter a valid email address',
    type: 'validation_error',
    code: 'invalid_email',
  };


  useEffect(() => {
    setPageSubmissionProps(async () => {
      if (!stripe || !elements) return RETURN_STRIPE_NOT_INITIALIZED;
      if (collectsEmail && !emailAddress) return RETURN_EMAIL_REQUIRED;
      if (emailAddress && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress)) return RETURN_EMAIL_INVALID;

      // transition('something')

      setIsProcessing(true);
      setError(null);
      addDebugMessage('Starting JIT payment process');

      try {
        // JIT Step 1: Validate payment details with elements.submit()
        addDebugMessage('Step 1: Validating payment details');

        const { error: submitError } = await elements.submit();
        if (submitError) {
          const errorMessage = submitError.message || 'Payment validation failed';
          setError(errorMessage);
          setIsProcessing(false);
          addDebugMessage(`Step 1 failed: ${errorMessage}`);
          return {
            error: errorMessage,
            type: submitError.type || 'validation_error',
            code: submitError.code || 'elements_submit_failed',
          };
        }

        addDebugMessage('Step 1 passed: Payment details validated');

        // JIT Step 2: Create intent on backend just-in-time
        addDebugMessage('Step 2: Creating payment intent on backend');

        const prepareResponse = await axios.post(`/checkouts/${sessionId}/mutations`, {
          action: 'prepare_payment',
          email: emailAddress,
          payment_type: paymentType,
          current_url: window.location.href, // Pass current URL for return after redirects
        });

        if (prepareResponse.status !== 200) {
          const errorMessage = prepareResponse.data?.message || 'Failed to prepare payment';

          // Check if this is a payment method rejection
          if (errorMessage.includes('payment method') || errorMessage.includes('not supported')) {
            // Try to extract supported methods from error or use defaults
            const supportedMethods = ['card', 'link']; // Default fallbacks
            handlePaymentMethodRejection(paymentType, supportedMethods);
            setIsProcessing(false);
            return {
              error: 'Payment method not supported, please try another method',
              type: 'payment_method_error',
              code: 'unsupported_payment_method',
            };
          }

          setError(errorMessage);
          setIsProcessing(false);
          addDebugMessage(`Step 2 failed: ${errorMessage}`);
          return {
            error: errorMessage,
            type: 'api_error',
            code: 'prepare_payment_failed',
          };
        }

        const { client_secret, intent_type, return_url, is_redirect_method, supported_payment_methods } = prepareResponse.data;

        if (!client_secret) {
          setError('Payment preparation failed - no client secret returned');
          setIsProcessing(false);
          addDebugMessage('Step 2 failed: No client secret returned');
          return {
            error: 'Payment preparation failed',
            type: 'api_error',
            code: 'missing_client_secret',
          };
        }

        addDebugMessage(`Step 2 passed: Intent created (${intent_type})`);

        // Check if backend supports the selected payment method
        if (supported_payment_methods && !supported_payment_methods.includes(paymentType)) {
          handlePaymentMethodRejection(paymentType, supported_payment_methods);
          setIsProcessing(false);
          return {
            error: 'Payment method not supported, please try another method',
            type: 'payment_method_error',
            code: 'unsupported_payment_method',
          };
        }

        // Use backend-provided redirect method flag
        const isRedirectMethod = is_redirect_method;

        // Build confirm params based on payment method type
        const confirmParams: any = {
          payment_method_data: {
            billing_details: {
              email: emailAddress,
            },
          },
        };

        // Always use backend-provided return_url - Stripe requires it for all confirmations
        if (return_url) {
          confirmParams.return_url = return_url;
        }

        let confirmError;
        let confirmResult;

        if (intent_type === 'payment') {
          addDebugMessage(`Using confirmPayment for payment intent (redirect: ${isRedirectMethod})`);

          let confirmResult;

          if (paymentType === 'card') {
            confirmParams.save_payment_method = true;

            // For card payments, confirm with elements
            confirmResult = await stripe.confirmPayment({
              elements,
              clientSecret: client_secret,
              confirmParams,
              redirect: 'if_required',
            });
          } else if (paymentType === 'klarna') {
            confirmResult = await stripe.confirmKlarnaPayment(
              client_secret,
              {
                return_url: return_url,
                payment_method: {
                  billing_details: {
                    email: emailAddress,
                    address: {
                      country: 'AU'
                    }
                  },
                }
              },
              {
                handleActions: false,
              }
            )
          } else {
            confirmResult = await stripe.confirmPayment({
              elements,
              clientSecret: client_secret,
              confirmParams,
              redirect: 'if_required',
            })
          }


          console.log("Stripe@confirmResult", { confirmResult });

          if (confirmResult.error) {
            // This point will only be reached if there is an immediate error when
            // confirming the payment. Show error to your customer (for example, payment
            // details incomplete)
            setError(confirmResult.error);
            setIsProcessing(false);
            addDebugMessage(`Step 2 failed: ${confirmResult.error}`);

            return {
              error,
              type: 'confirmation_error',
              code: 'stripe_confirm_failed',
            }
          }

          if (confirmResult?.paymentIntent.next_action?.redirect_to_url?.url) {
            // if we're in an iframe?
            if (window.parent !== window) {
              window.location.href = confirmResult.paymentIntent.next_action.redirect_to_url.url;
              // we're in an iframe, so we need to post a message to the parent!
            } else {
              window.parent.postMessage(new MessageEvent('payment_redirect', {
                url: 'http://example.com/test',
              }), '*');
            }


            return {
              error: 'Redirecting you to complete payment',
              type: 'payment_redirect',
              code: false,
            };
          }
        } else if (intent_type === 'setup') {
          addDebugMessage(`Using confirmSetup for setup intent (redirect: ${isRedirectMethod})`);

          confirmResult = await stripe.confirmSetup({
            elements,
            clientSecret: client_secret,
            confirmParams,
            redirect: 'if_required',
          });
          confirmError = confirmResult.error;
        } else {
          throw new Error(`Unknown intent type: ${intent_type}`);
        }

        if (confirmError) {
          const errorMessage = confirmError.message || 'Payment confirmation failed';

          return {
            error: errorMessage,
            type: confirmError.type || 'confirmation_error',
            code: confirmError.code || 'stripe_confirm_failed',
          };
        }

        // Check if this is a redirect-based payment that requires user action
        if (confirmResult && confirmResult.paymentIntent
          && confirmResult.paymentIntent.status === 'requires_action'
        ) {
          addDebugMessage('Step 2: Redirect payment requires action - user will be redirected');
          setIsProcessing(false);

          return {
            payment_confirmed: false,
            requires_action: true,
            email: emailAddress,
            intent_type: intent_type,
            jit_process: 'redirect_initiated',
          };
        }

        // Check if this is a setup intent that requires action
        if (confirmResult && confirmResult.setupIntent && confirmResult.setupIntent.status === 'requires_action') {
          addDebugMessage('Step 2: Setup intent requires action - user will be redirected');
          setIsProcessing(false);

          return {
            payment_confirmed: false,
            requires_action: true,
            email: emailAddress,
            intent_type: intent_type,
            jit_process: 'redirect_initiated',
          };
        }

        // Payment confirmed successfully (for immediate payments like cards)
        addDebugMessage('Step 2 passed: Payment confirmed successfully (immediate)');
        setIsProcessing(false);

        console.log('CONFMRING AND PROCEEDING!');

        if (onSuccess) onSuccess();

        return {
          payment_confirmed: true,
          email: emailAddress,
          intent_type: intent_type,
          jit_process: 'completed',
        };

      } catch (error: any) {
        console.error('JIT: Payment processing error:', error);
        const errorMessage = error.response?.data?.message || error.message;

        // Check if this is a payment method rejection
        if (errorMessage.includes('payment method') || errorMessage.includes('not supported')) {
          const supportedMethods = ['card', 'link']; // Default fallbacks
          handlePaymentMethodRejection(paymentType, supportedMethods);
          setIsProcessing(false);
          return {
            error: 'Payment method not supported, please try another method',
            type: 'payment_method_error',
            code: 'unsupported_payment_method',
          };
        }

        setError(errorMessage);
        setIsProcessing(false);
        addDebugMessage(`Process failed: ${errorMessage}`);
        return {
          error: errorMessage,
          type: 'api_error',
          code: 'unexpected_error',
        };
      }
    });
  }, [stripe, elements, emailAddress, collectsEmail, sessionId, paymentType]);

  // Get enabled payment methods from session using intelligence service - memoized
  const paymentSessionForForm = useMemo(() => toPaymentSession(session), [session]);
  const { wallets } = useMemo(() => {
    return paymentIntelligence.getAvailableMethodsForContext(paymentSessionForForm);
  }, [paymentSessionForForm]);

  return (
    <div className="flex flex-col space-y-4" style={style}>
      {/* Payment Method Memory Status */}
      {selectedPaymentMethod && selectedPaymentMethod !== paymentType && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">
              Payment method switched to {paymentType} (previously {selectedPaymentMethod})
            </span>
          </div>
        </div>
      )}

      {/* Error overlay - positioned absolutely over the Payment Element */}
      {error && (
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded shadow-lg max-w-md">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Payment Error</span>
              </div>
              <p className="text-sm mb-3">{error}</p>
              {debugMessages.length > 0 && (
                <div className="mb-3 text-xs font-mono">
                  <div className="text-red-600 font-semibold mb-1">Debug trace:</div>
                  {debugMessages.map((msg, i) => (
                    <div key={i} className="text-red-500">{msg}</div>
                  ))}
                </div>
              )}
              <button
                onClick={() => {
                  setError(null);
                  setDebugMessages([]);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Approval Overlay */}
      {waitingForApproval && (
        <div className="relative">
          <div className="fixed top-10 w-100 h-auto left-10 inset-0">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-6 py-4 rounded shadow-lg">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-bold text-lg">Debug Approval Required</span>
              </div>

              <div className="mb-4">
                <div className="font-semibold text-sm mb-2">Current Step: {currentStep}</div>
                {stepData && (
                  <div className="text-xs font-mono bg-yellow-100 p-2 rounded mb-2">
                    <div className="font-semibold mb-1">Step Data:</div>
                    <pre className="whitespace-pre-wrap text-xs">
                      {JSON.stringify(stepData, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="text-sm">
                  Review the information above and click "Continue" to proceed to the next step.
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if ((window as any).__debugApprovalResolve) {
                      (window as any).__debugApprovalResolve();
                      (window as any).__debugApprovalResolve = null;
                    }
                    setWaitingForApproval(false);
                    setCurrentStep('');
                    setStepData(null);
                  }}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  ✅ Continue
                </button>
                <button
                  onClick={() => {
                    setWaitingForApproval(false);
                    setCurrentStep('');
                    setStepData(null);
                    setError('Payment cancelled by user during debug');
                    setIsProcessing(false);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Processing overlay - positioned absolutely over the Payment Element */}
      {isProcessing && !waitingForApproval && (
        <div className="relative">
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded">
            <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded shadow-lg">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                <span className="font-medium">Processing Payment...</span>
              </div>
              <p className="mt-1 text-sm">
                Please wait while we process your payment using the JIT system.
              </p>
              {debugMessages.length > 0 && (
                <div className="mt-2 text-xs font-mono">
                  {debugMessages.map((msg, i) => (
                    <div key={i} className="text-blue-600">{msg}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PaymentElement
        onChange={handlePaymentMethodChange}
        options={{
          defaultValues: {
            billingDetails: {
              name: '',
              email: emailAddress || '',
            },
          },
          layout: {
            type: 'tabs',
            // type: 'accordion',
            defaultCollapsed: false,
          },
          wallets,
        }}
      />
      {/*<AddressElement*/}
      {/*  options={{*/}
      {/*    mode: 'billing',*/}
      {/*  }}*/}
      {/*/>*/}
       {/* Debug messages during interaction */}
       {debugMessages.length > 0 && !isProcessing && (
        <div style={{
          padding: '8px',
          backgroundColor: '#f0f8ff',
          border: '1px solid #b0d4f1',
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>🔧 JIT Process Log:</div>
          {debugMessages.map((msg, i) => (
            <div key={i} style={{ color: '#2563eb' }}>{msg}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StripeElementsComponent;
