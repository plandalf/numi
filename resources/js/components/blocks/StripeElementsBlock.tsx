import Numi, { Appearance, FontValue, Style } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { useState, useEffect, useRef, useMemo, CSSProperties } from "react";
import { Elements, PaymentElement, useStripe, useElements, AddressElement } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useCheckoutState } from "@/pages/checkout-main";
import { resolveThemeValue } from "@/lib/theme";
import { addAlphaToColor } from "../ui/color-picker";
import { MarkdownText } from "../ui/markdown-text";
import { buildGoogleFontsUrl, getFontsFromStyle } from "@/utils/font-finder";
import { usePage } from "@inertiajs/react";
import { Font } from "@/types";

// Define the type for the checkout state
interface CheckoutState {
  setPageSubmissionProps: (props: (() => Promise<any>) | null) => void;
}

// This should be loaded from your environment variables
function StripeElementsComponent({ context }: { context: BlockContextType }) {
  const { session, isEditor } = Numi.useCheckout({});
  const { fonts } = usePage().props as { fonts: Font[] };

  const theme = Numi.useTheme();
  const [stripePromise, setStripePromise] = useState<Stripe | null>(null);

  const [title] = Numi.useStateString({
    label: 'Title',
    name: 'title',
    defaultValue: 'Payment Information',
    inspector: 'multiline',
    format: 'markdown',
  });

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
    Style.backgroundColor('backgroundColor', 'Background Color', {}, theme?.primary_surface_color),
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
    Style.backgroundColor('paymentFormBackgroundColor', 'Payment Form Background Color', {}, theme?.primary_surface_color),
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
    //borderColor: resolveThemeValue(style.borderColor, theme),
    //borderWidth: style.border?.width,
    //borderStyle: style.border?.style,
    //borderRadius : style.borderRadius,
    //boxShadow: style.shadow,
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

  useEffect(() => {
    async function initializeStripe() {
      if (initializationAttempted.current) return;
      initializationAttempted.current = true;

      try {
        if (!session.publishable_key) {
          throw new Error('Stripe publishable key is missing');
        }
        const stripe = await loadStripe(session.publishable_key);
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }
        setStripePromise(stripe);
      } catch (error: any) {
        console.error('Stripe initialization error:', error);
        setStripeError(error.message);
      }

      setIsLoading(false)
    }

    initializeStripe();
  }, [session.publishable_key]);

  if(style.hidden) {
    return null;
  }

  const googleFontsUrl = useMemo(() => {
    const uniqueFonts = !isEditor
      ? fonts .filter(f => ['Inter', ...getFontsFromStyle(style)].includes(f.name))
      : fonts;

    return buildGoogleFontsUrl(uniqueFonts);
  }, [style, isEditor, fonts]);


  const stripeElementAppearance = useMemo(() => {

    const inputLabelFont = {
      ...resolveThemeValue(style?.inputLabelFont, theme, 'label_typography') as FontValue,
      color: resolveThemeValue(style?.inputLabelFont?.color, theme),
    } as FontValue;

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
          boxShadow: 'none',
          borderRadius: paymentFormStyle.borderRadius,
          backgroundColor: paymentFormStyle.backgroundColor,
          borderWidth: '0px',
          borderStyle: 'none',
          margin: '0px',
          padding: '2px',
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
      }
    }
  }, [style, appearance,theme, containerStyle, errorPanelStyle]);

  const stripeOptions = useMemo(() => ({
    mode: 'setup',
    currency: session.currency.toLocaleLowerCase(),
    appearance: stripeElementAppearance,
    fonts: [{
      cssSrc: googleFontsUrl,
    }],
  }), [session, stripeElementAppearance, googleFontsUrl]);

  return (
    <div className="flex flex-col gap-4" style={containerStyle}>
      {title && (
        <MarkdownText theme={theme} text={title} style={titleStyle} />
      )}
      {description && (
        <MarkdownText theme={theme} text={description} style={descriptionStyle} />
      )}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded" style={errorPanelStyle}>
          {error}
        </div>
      ) : stripePromise ? (
        <Elements
          stripe={stripePromise}
          options={stripeOptions}>
          <PaymentForm style={paymentFormStyle} />
        </Elements>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded" style={warningPanelStyle}>
          Unable to initialize payment. Please try again later.
        </div>
      )}
    </div>
  );
}

// Separate component for the payment form to use Stripe hooks
function PaymentForm({ style }: { style?: CSSProperties}) {
  const stripe = useStripe();
  const elements = useElements();
  const { setPageSubmissionProps } = useCheckoutState() as CheckoutState;

  useEffect(() => {
    setPageSubmissionProps(async () => {
      if (!stripe || !elements) {
        return {
          error: 'Stripe has not been initialized',
          type: 'validation_error',
          code: 'stripe_not_initialized',
        };
      }

      try {
        // Submit the form to validate the payment method
        const { error: submitError } = await elements.submit();
        if (submitError) {
          return {
            error: submitError.message,
            type: submitError.type,
            code: submitError.code,
          };
        }

        // Create a confirmation token
        const confirmationTokenResult = await stripe.createConfirmationToken({
          elements,
          params: {}
        });

        if (confirmationTokenResult.error) {
          return {
            error: confirmationTokenResult.error.message,
            type: confirmationTokenResult.error.type,
            code: confirmationTokenResult.error.code,
          };
        }

        return {
          confirmation_token: confirmationTokenResult.confirmationToken?.id
        };
      } catch (error: any) {
        return {
          error: error.message,
          type: 'api_error',
          code: 'unexpected_error',
        };
      }
    });
  }, [stripe, elements]);

  return (
    <div className="flex flex-col space-y-4" style={style}>
      <PaymentElement
        options={{
          defaultValues: {
            billingDetails: {
              name: '',
              email: '',
            },
          },
        }}
      />
      <AddressElement
        options={{
          mode: 'billing',
        }}
      />
    </div>
  );
}

export default StripeElementsComponent;
