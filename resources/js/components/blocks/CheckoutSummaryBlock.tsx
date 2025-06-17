import Numi, { Appearance, FontValue, Style } from "@/contexts/Numi";
import { resolveThemeValue } from "@/lib/theme";
import { cn, formatMoney } from "@/lib/utils";
import { BlockContextType } from "@/types/blocks";
import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Discount } from "@/types/product";
import { CircleAlert, Loader2, XIcon } from "lucide-react";
import { CheckoutItem } from "@/types/checkout";
import { Separator } from "../ui/separator";
import { MarkdownText } from "../ui/markdown-text";

function CheckoutSummaryComponent({ context }: { context: BlockContextType }) {
  const theme = Numi.useTheme();
  const { session, addDiscount, removeDiscount, isEditor } = Numi.useCheckout({

  });

  const [title] = Numi.useStateString({
    label: 'Title',
    name: 'title',
    defaultValue: 'Order Summary',
  });

  const [showImages] = Numi.useStateBoolean({
    label: 'Show Images',
    name: 'showImages',
    defaultValue: true,
    inspector: 'checkbox',
    group: 'lineItems',
  });

  const [showItemPrices] = Numi.useStateBoolean({
    label: 'Show Item Prices',
    name: 'showItemPrices',
    defaultValue: true,
    inspector: 'checkbox',
    group: 'lineItems',
  });

  const [showSubtotal] = Numi.useStateBoolean({
    label: 'Show Subtotal',
    name: 'showSubtotal',
    defaultValue: true,
    inspector: 'checkbox',
    group: 'lineItems',
  });

  const [showTaxes] = Numi.useStateBoolean({
    label: 'Show Taxes',
    name: 'showTaxes',
    defaultValue: true,
    inspector: 'checkbox',
    group: 'lineItems',
  });

  const [taxesLabel] = Numi.useStateString({
    label: 'Taxes Label',
    name: 'taxesLabel',
    defaultValue: 'Taxes',
    group: 'lineItems',
  });

  const [showShipping] = Numi.useStateBoolean({
    label: 'Show Shipping',
    name: 'showShipping',
    defaultValue: true,
    inspector: 'checkbox',
    group: 'lineItems',
  });

  const [showQuantity] = Numi.useStateBoolean({
    label: 'Show Quantity',
    name: 'showQuantity',
    defaultValue: true,
    inspector: 'checkbox',
    group: 'lineItems',
  });

  const [showCurrency] = Numi.useStateBoolean({
    label: 'Show Currency',
    name: 'showCurrency',
    defaultValue: true,
    inspector: 'checkbox',
    group: 'lineItems',
  });

  const [discountCode, setDiscountCode] = Numi.useStateString({
    label: 'Allow discount codes',
    name: 'discountCode',
    defaultValue: '',
    inspector: 'hidden',
    group: 'discountCodes',
  });

  const [stackedDiscounts, setStackedDiscounts] = Numi.useStateBoolean({
    label: 'Allow stacking discounts',
    name: 'stackedDiscounts',
    defaultValue: false,
    inspector: 'checkbox',
    group: 'discountCodes',
  });

  const [showDiscountForm, setShowDiscountForm] = Numi.useStateBoolean({
    label: 'Show discount form',
    name: 'showDiscountForm',
    defaultValue: true,
    inspector: 'checkbox',
    group: 'discountCodes',
  });

  const [discountCtaLabel, setDiscountCtaLabel] = Numi.useStateString({
    label: 'Label',
    name: 'discountCtaLabel',
    defaultValue: 'Apply',
    group: 'discountCodes',
  });

  const [totalLabel, setTotalLabel] = Numi.useStateString({
    label: 'Label',
    name: 'totalLabel',
    defaultValue: 'Total',
    group: 'total',
  });

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
    Appearance.spacing('summarySpacing', 'Summary spacing', { config: { format: 'single' } }),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const fontConfig = {
    config: {
      hideVerticalAlignment: true,
      hideHorizontalAlignment: true,
    },
  };

  const style = Numi.useStyle([
    Style.backgroundColor('backgroundColor', 'Background Color', {}, theme?.primary_surface_color),
    Style.font('titleFont', 'Title Font & Color', fontConfig, theme?.label_typography as FontValue),
    Style.font('labelFont', 'Label Font & Color', fontConfig, theme?.label_typography as FontValue),
    Style.font('itemFont', 'Item Font & Color', fontConfig, theme?.body_typography as FontValue),
    Style.font('itemPriceFont', 'Item Price Font & Color', fontConfig, theme?.label_typography as FontValue),
    Style.font('itemQuantityFont', 'Item Quantity Font & Color', fontConfig, {
      ...theme?.body_typography as FontValue,
      color: '#6a7282'
    }),
    Style.backgroundColor('inputBackgroundColor', 'Input Background Color', {}, theme?.secondary_surface_color),
    Style.font('inputFont', 'Input Font & Color', fontConfig, theme?.body_typography as FontValue),
    Style.border('inputBorder', 'Input Border', {}, { width: '1px', style: 'solid' }),
    Style.borderColor('inputBorderColor', 'Input Border Color', {}, theme?.primary_border_color),
    Style.backgroundColor('buttonBackgroundColor', 'Button Background Color', {}, theme?.primary_color),
    Style.font('buttonTextFont', 'Button Text Font & Color', fontConfig,
      {
        ...theme?.body_typography,
        color: theme?.primary_contrast_color,
      }
    ),
    Style.shadow('buttonShadow', 'Button Shadow', {}, theme?.shadow),
    Style.font('summaryTextFont', 'Summary Text Font & Color', fontConfig, theme?.body_typography as FontValue),
    Style.font('discountTextFont', 'Discount Text Font & Color',
      fontConfig,
      {
        ...theme?.body_typography,
        color: '#00a63e'
      },
    ),
    Style.font('totalTextFont', 'Total Text Font & Color', fontConfig, theme?.label_typography as FontValue),
    Style.backgroundColor('dividerColor', 'Divider Color', {}, theme?.secondary_border_color),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, theme?.border_radius),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, theme?.shadow),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);



  const containerStyle = useMemo(() => {
    return {
      backgroundColor: resolveThemeValue(style.backgroundColor, theme, 'primary_surface_color') as string,
      padding: appearance.padding,
      margin: appearance.margin,
      gap: appearance.spacing,
      borderColor: resolveThemeValue(style.borderColor, theme),
      borderWidth: style?.border?.width,
      borderStyle: style?.border?.style,
      borderRadius: style?.borderRadius ?? '3px',
      boxShadow: style?.shadow,
    };
  }, [style]);

  const { executeCallbacks } = Numi.useEventCallback({
    name: 'click',
  });

  const titleStyle = useMemo(() => {
    return {
      color: resolveThemeValue(style.titleFont?.color, theme),
      fontFamily: style?.titleFont?.font,
      fontWeight: style?.titleFont?.weight,
      fontSize: style?.titleFont?.size,
      lineHeight: style?.titleFont?.lineHeight,
      letterSpacing: style?.titleFont?.letterSpacing,
    };
  }, [style?.titleFont]);

  const labelStyle = useMemo(() => {
    return {
      color: resolveThemeValue(style.labelFont?.color, theme),
      fontFamily: style?.labelFont?.font,
      fontWeight: style?.labelFont?.weight,
      fontSize: style?.labelFont?.size,
      lineHeight: style?.labelFont?.lineHeight,
      letterSpacing: style?.labelFont?.letterSpacing,
    };
  }, [style?.labelFont]);

  const itemStyle = useMemo(() => {
    return {
      color: resolveThemeValue(style.itemFont?.color, theme),
      fontFamily: style?.itemFont?.font,
      fontWeight: style?.itemFont?.weight,
      fontSize: style?.itemFont?.size,
      lineHeight: style?.itemFont?.lineHeight,
      letterSpacing: style?.itemFont?.letterSpacing,
    };
  }, [style?.itemFont]);

  const itemPriceStyle = useMemo(() => {
    return {
      color: resolveThemeValue(style.itemPriceFont?.color, theme),
      fontFamily: style?.itemPriceFont?.font,
      fontWeight: style?.itemPriceFont?.weight,
      fontSize: style?.itemPriceFont?.size,
      lineHeight: style?.itemPriceFont?.lineHeight,
      letterSpacing: style?.itemPriceFont?.letterSpacing,
    };
  }, [style?.itemPriceFont]);

  const itemQuantityStyle = useMemo(() => {
    return {
      color: resolveThemeValue(style.itemQuantityFont?.color, theme),
      fontFamily: style?.itemQuantityFont?.font,
      fontWeight: style?.itemQuantityFont?.weight,
      fontSize: style?.itemQuantityFont?.size,
      lineHeight: style?.itemQuantityFont?.lineHeight,
      letterSpacing: style?.itemQuantityFont?.letterSpacing,
    };
  }, [style?.itemQuantityFont]);



  const inputStyle = useMemo(() => {
    return {
      backgroundColor: resolveThemeValue(style.inputBackgroundColor, theme, 'secondary_surface_color') as string,
      color: resolveThemeValue(style?.inputFont?.color, theme),
      fontFamily: style?.inputFont?.font,
      fontWeight: style?.inputFont?.weight,
      fontSize: style?.inputFont?.size,
      lineHeight: style?.inputFont?.lineHeight,
      letterSpacing: style?.inputFont?.letterSpacing,
      borderColor: resolveThemeValue(style.inputBorderColor, theme, 'primary_border_color'),
      borderWidth: style?.inputBorder?.width,
      borderStyle: style?.inputBorder?.style,
    };
  }, [style]);




  const buttonStyle = useMemo(() => {
    const buttonTextFont = {
      ...resolveThemeValue(style?.buttonTextFont, theme, 'body_typography') as FontValue,
      color: resolveThemeValue(style?.buttonTextFont?.color, theme, 'primary_contrast_color'),
    } as FontValue;
    return {
      color: resolveThemeValue(buttonTextFont?.color, theme),
      backgroundColor: resolveThemeValue(style.buttonBackgroundColor, theme, 'primary_color'),
      fontFamily: buttonTextFont?.font,
      fontWeight: buttonTextFont?.weight,
      fontSize: buttonTextFont?.size,
      lineHeight: buttonTextFont?.lineHeight,
      letterSpacing: buttonTextFont?.letterSpacing,
      boxShadow: style?.buttonShadow,
    };
  }, [style?.buttonTextFont, style?.buttonBackgroundColor, style?.buttonShadow]);

  const summaryTextStyle = useMemo(() => {
    return {
      color: resolveThemeValue(style.summaryTextFont?.color, theme),
      fontFamily: style?.summaryTextFont?.font,
      fontWeight: style?.summaryTextFont?.weight,
      fontSize: style?.summaryTextFont?.size,
      lineHeight: style?.summaryTextFont?.lineHeight,
      letterSpacing: style?.summaryTextFont?.letterSpacing,
    };
  }, [style?.summaryTextFont]);

  const discountTextStyle = useMemo(() => {
    return {
      color: resolveThemeValue(style?.discountTextFont?.color, theme),
      fontFamily: style?.discountTextFont?.font,
      fontWeight: style?.discountTextFont?.weight,
      fontSize: style?.discountTextFont?.size,
      lineHeight: style?.discountTextFont?.lineHeight,
      letterSpacing: style?.discountTextFont?.letterSpacing,
    };
  }, [style?.discountTextFont]);

  const totalTextStyle = useMemo(() => {
    return {
      color: resolveThemeValue(style?.totalTextFont?.color, theme),
      fontFamily: style?.totalTextFont?.font,
      fontWeight: style?.totalTextFont?.weight,
      fontSize: style?.totalTextFont?.size,
      lineHeight: style?.totalTextFont?.lineHeight,
      letterSpacing: style?.totalTextFont?.letterSpacing,
    };
  }, [style?.totalTextFont]);

  const dividerStyle = useMemo(() => {
    return {
      backgroundColor: resolveThemeValue(style.dividerColor, theme, 'primary_border_color') as string,
    };
  }, [style]);

  const summaryContainerStyle = useMemo(() => {
    return {
      gap: appearance.summarySpacing,
    };
  }, [appearance.summarySpacing]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDiscountSubmitting, setIsDiscountSubmitting] = useState(false);

  const handleApplyDiscount = () => {
    // await this here,
    if (discountCode.trim()) {
      setIsDiscountSubmitting(true);
      addDiscount(discountCode).then((status: { success: boolean, message: string }) => {
        if (status.success) {
          setDiscountCode('');
          setErrors({ ...errors, discount: '' });
        } else {
          setErrors({ discount: status.message });
        }
      }).finally(() => {
        setIsDiscountSubmitting(false);
      });
    }
  };

  const handleRemoveDiscount = (discount: string) => {
    removeDiscount(discount).then((status: { success: boolean, message: string }) => {
      if (status.success) {
        setErrors({ ...errors, discount: '' });
      } else {
        setErrors({ discount: status.message });
      }
    });
  };

  const canAddDiscount = useMemo(() => {
    if (stackedDiscounts) return true;

    return !session.discounts || session.discounts.length === 0;
  }, [stackedDiscounts, session.discounts]);

  if (style.hidden) {
    return null;
  }

  const currency = useMemo(() => {
    if (showCurrency) {
      return session.currency;
    }
    return undefined;
  }, [session.currency, showCurrency]);

  const LineItem = ({ item }: { item: CheckoutItem }) => {
    return (<div className="flex-grow overflow-hidden">
      <div className="flex justify-between gap-4">
          {item?.is_highlighted ? 
            // Use H3 styling for highlighted items
            <MarkdownText
              theme={theme}
              text={`### ${item.price?.name}`}
              className="font-medium break-all"
            />
          : 
            <div
              className="font-medium break-all"
              style={itemStyle}
            >
              {item.price?.name}
            </div>
          }
        {showItemPrices && item.total !== undefined && (
          <div className="text-gray-700" style={itemPriceStyle}>{formatMoney(item.total, currency)}</div>
        )}
      </div>
      {showQuantity && item.price?.type === 'one_time' && <div className="text-sm text-gray-500" style={itemQuantityStyle}>
        Qty: {item.quantity} {showItemPrices && item.total !== undefined && `× ${formatMoney(item.subtotal, currency)}`}
      </div>}
      {item.price && item.price.type !== 'one_time' && (
          <div className="text-sm text-gray-700">
              <div>Price per {item.price.renew_interval}: {formatMoney(item.total, currency)}</div>
              {item.price.cancel_after_cycles && (
                <div>Total ({item.price.cancel_after_cycles} {item.price.renew_interval}s): {formatMoney(item.price.cancel_after_cycles * item.total, currency)}</div>
              )}
          </div>
        )}
    </div>)
  }

  return (
    <div className="flex flex-col p-4 gap-4" style={containerStyle}>
      {title && <h3 className="font-medium text-lg" style={titleStyle}>{title}</h3>}
      {/* Order Items */}
      <div className="space-y-3 overflow-y-auto h-auto max-h-[300px]">
        {session.line_items.length === 0 && (
          <div className="flex gap-3 border border-destructive text-destructive rounded-md p-4 mt-3.5">
            <CircleAlert className="w-5 h-5 mt-0.5" />
            No items to checkout
          </div>
        )}
        {session.line_items.map((item: CheckoutItem) => (
          <div key={item.id} className="flex items-center gap-3">
            {showImages && item.product?.image && (
              <div className="w-12 h-12 border rounded flex-shrink-0">
                <img src={item.product?.image} alt={item.product?.name || item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <LineItem item={item} />
          </div>
        ))}
      </div>
      {(showDiscountForm || showSubtotal || showShipping || showTaxes) && (
        <Separator style={dividerStyle} />
      )}
      {/* Discount Code Form */}
      {showDiscountForm && (
        <div className="flex flex-col gap-2">
          <label htmlFor="discount-code" className="block mb-1" style={labelStyle}>Discount code</label>
          {canAddDiscount && <div className="flex gap-2">
            <input
              type="text"
              id="discount-code"
              className="border bg-white rounded p-2 text-sm flex-grow"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Enter discount code"
              style={inputStyle}
              autoComplete="off"
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              className="min-w-24 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-2 px-4 rounded"
              style={buttonStyle}
              disabled={isDiscountSubmitting || isEditor}
            >
              {isDiscountSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : discountCtaLabel}
            </button>
          </div>}
          {errors.discount && <p className="text-sm text-red-500">{errors.discount}</p>}
          {session.discounts && session.discounts.length > 0 && (
            <div className="flex gap-2 mt-2">
              {session.discounts?.map((discount: Discount) => (
                <div key={discount.id} className="flex justify-between items-center bg-gray-100 p-2 gap-2">
                  <span>{discount.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDiscount(discount.id)}
                    className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm rounded"
                    style={buttonStyle}
                  >
                    <XIcon className="w-4 h-4 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Order Summary Calculations */}
      {(showSubtotal || showShipping || showTaxes || (session.discounts && session.discounts.length > 0)) && (
        <div className="space-y-2 text-sm flex flex-col" style={summaryContainerStyle}>
          {showSubtotal && <div className="flex justify-between">
            <span style={summaryTextStyle}>Subtotal</span>
            <span style={summaryTextStyle}>{formatMoney(session.subtotal, currency)}</span>
          </div>}

          {showShipping && session.shipping > 0 && (
            <div className="flex justify-between">
              <span style={summaryTextStyle}>Shipping</span>
              <span style={summaryTextStyle}>{formatMoney(session.shipping, currency)}</span>
            </div>
          )}


          {showTaxes && (session.inclusive_taxes) > 0 && (
            <div className="flex justify-between">
              <span style={summaryTextStyle}>{taxesLabel}</span>
              <span style={summaryTextStyle}>
                {formatMoney(session.inclusive_taxes, currency)}
                {/* {session.exclusive_taxes > 0 && ` + ${formatMoney(session.exclusive_taxes, currency)}`} */}
              </span>
            </div>
          )}

          {session.discounts && session.discounts.length > 0 && (
            <div className="flex justify-between text-green-600">
              <span style={discountTextStyle}>Discount</span>
              <span style={discountTextStyle}>-{formatMoney(session.discounts.reduce((acc, discount) => {
                if (discount.amount_off !== null) {
                  return acc + discount.amount_off;
                } else if (discount.percent_off !== null) {
                  // Calculate percentage discount based on subtotal
                  return acc + (session.subtotal * (discount.percent_off / 100));
                }
                return acc;
              }, 0), currency)}</span>
            </div>
          )}
        </div>
      )}

      <Separator style={dividerStyle} />
      {/* Total */}
      <div className="flex justify-between font-semibold text-lg">
        <span style={totalTextStyle}>{totalLabel}</span>
        <span style={totalTextStyle}>{formatMoney(session.total, currency)}</span>
      </div>
    </div>
  );
}

export default CheckoutSummaryComponent;
