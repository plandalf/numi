import Numi, { Appearance, Style } from "@/contexts/Numi";
import { cn, formatMoney } from "@/lib/utils";
import { BlockContextType } from "@/types/blocks";
import { useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";
import { Discount } from "@/types/product";
import { Loader2, XIcon } from "lucide-react";
import { CheckoutItem } from "@/types/checkout";

function CheckoutSummaryComponent({ context }: { context: BlockContextType }) {

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

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const fontConfig = {
    config: {
      hideVerticalAlignment: true,
      hideHorizontalAlignment: true,
    },
  };

  const style = Numi.useStyle([
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),
    Style.font('titleFont', 'Title Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '900',
        size: '18px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.font('labelFont', 'Label Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.font('itemFont', 'Item Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.font('itemPriceFont', 'Item Price Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.font('itemQuantityFont', 'Item Quantity Font & Color',
      fontConfig,
      {
        color: '#6a7282',
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.backgroundColor('inputBackgroundColor', 'Input Background Color', {}, '#FFFFFF'),
    Style.font('inputFont', 'Input Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.backgroundColor('buttonBackgroundColor', 'Button Background Color', {}, '#f6f3f4'),
    Style.font('buttonTextFont', 'Button Text Font & Color',
      fontConfig,
      {
        color: '#1e2939',
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.font('summaryTextFont', 'Summary Text Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.font('discountTextFont', 'Discount Text Font & Color',
      fontConfig,
      {
        color: '#00a63e',
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.font('totalTextFont', 'Total Text Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '900',
        size: '18px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '0px'),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, ''),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const containerStyle = useMemo(() => {
    return {
      backgroundColor: style.backgroundColor || '',
      padding: appearance?.padding,
      margin: appearance?.margin,
      gap: !appearance?.spacing ? '0px' : appearance?.spacing,
      borderColor: style.borderColor,
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
      color: style.titleFont?.color,
      fontFamily: style?.titleFont?.font,
      fontWeight: style?.titleFont?.weight,
      fontSize: style?.titleFont?.size,
      lineHeight: style?.titleFont?.lineHeight,
      letterSpacing: style?.titleFont?.letterSpacing,
    };
  }, [style?.titleFont]);

  const labelStyle = useMemo(() => {
    return {
      color: style.labelFont?.color,
      fontFamily: style?.labelFont?.font,
      fontWeight: style?.labelFont?.weight,
      fontSize: style?.labelFont?.size,
      lineHeight: style?.labelFont?.lineHeight,
      letterSpacing: style?.labelFont?.letterSpacing,
    };
  }, [style?.labelFont]);

  const itemStyle = useMemo(() => {
    return {
      color: style.itemFont?.color,
      fontFamily: style?.itemFont?.font,
      fontWeight: style?.itemFont?.weight,
      fontSize: style?.itemFont?.size,
      lineHeight: style?.itemFont?.lineHeight,
      letterSpacing: style?.itemFont?.letterSpacing,
    };
  }, [style?.itemFont]);

  const itemPriceStyle = useMemo(() => {
    return {
      color: style.itemPriceFont?.color,
      fontFamily: style?.itemPriceFont?.font,
      fontWeight: style?.itemPriceFont?.weight,
      fontSize: style?.itemPriceFont?.size,
      lineHeight: style?.itemPriceFont?.lineHeight,
      letterSpacing: style?.itemPriceFont?.letterSpacing,
    };
  }, [style?.itemPriceFont]);

  const itemQuantityStyle = useMemo(() => {
    return {
      color: style.itemQuantityFont?.color,
      fontFamily: style?.itemQuantityFont?.font,
      fontWeight: style?.itemQuantityFont?.weight,
      fontSize: style?.itemQuantityFont?.size,
      lineHeight: style?.itemQuantityFont?.lineHeight,
      letterSpacing: style?.itemQuantityFont?.letterSpacing,
    };
  }, [style?.itemQuantityFont]);

  const inputStyle = useMemo(() => {
    return {
      backgroundColor: style?.inputBackgroundColor,
      color: style?.inputFont?.color,
      fontFamily: style?.inputFont?.font,
      fontWeight: style?.inputFont?.weight,
      fontSize: style?.inputFont?.size,
      lineHeight: style?.inputFont?.lineHeight,
      letterSpacing: style?.inputFont?.letterSpacing,
    };
  }, [style?.inputFont, style?.inputBackgroundColor]);

  const buttonStyle = useMemo(() => {
    return {
      color: style.buttonTextFont?.color,
      backgroundColor: style.buttonBackgroundColor,
      fontFamily: style?.buttonTextFont?.font,
      fontWeight: style?.buttonTextFont?.weight,
      fontSize: style?.buttonTextFont?.size,
      lineHeight: style?.buttonTextFont?.lineHeight,
      letterSpacing: style?.buttonTextFont?.letterSpacing,
    };
  }, [style?.buttonTextFont, style?.buttonBackgroundColor]);

  const summaryTextStyle = useMemo(() => {
    return {
      color: style.summaryTextFont?.color,
      fontFamily: style?.summaryTextFont?.font,
      fontWeight: style?.summaryTextFont?.weight,
      fontSize: style?.summaryTextFont?.size,
      lineHeight: style?.summaryTextFont?.lineHeight,
      letterSpacing: style?.summaryTextFont?.letterSpacing,
    };
  }, [style?.summaryTextFont]);

  const discountTextStyle = useMemo(() => {
    return {
      color: style?.discountTextFont?.color,
      fontFamily: style?.discountTextFont?.font,
      fontWeight: style?.discountTextFont?.weight,
      fontSize: style?.discountTextFont?.size,
      lineHeight: style?.discountTextFont?.lineHeight,
      letterSpacing: style?.discountTextFont?.letterSpacing,
    };
  }, [style?.discountTextFont]);

  const totalTextStyle = useMemo(() => {
    return {
      color: style?.totalTextFont?.color,
      fontFamily: style?.totalTextFont?.font,
      fontWeight: style?.totalTextFont?.weight,
      fontSize: style?.totalTextFont?.size,
      lineHeight: style?.totalTextFont?.lineHeight,
      letterSpacing: style?.totalTextFont?.letterSpacing,
    };
  }, [style?.totalTextFont]);

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

  console.log("session", session.line_items);
  return (
    <div className="flex flex-col p-4'" style={containerStyle}>
      <h3 className="font-medium text-lg mb-4" style={titleStyle}>{title}</h3>
      {/* Order Items */}
      <div className="space-y-3 mb-4">
        {session.line_items.map((item: CheckoutItem) => (
          <div key={item.id} className="flex items-center gap-3">
            {showImages && item.product?.image && (
              <div className="w-12 h-12 border rounded flex-shrink-0">
                <img src={item.product?.image} alt={item.product?.name || item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-grow">
              <div className="flex justify-between">
                <div className="font-medium" style={itemStyle}>{item.product?.name || item.name}</div>
                {showItemPrices && item.total !== undefined && (
                  <div className="text-gray-700" style={itemPriceStyle}>{formatMoney(item.total, item.currency)}</div>
                )}
              </div>
              <div className="text-sm text-gray-500" style={itemQuantityStyle}>
                Qty: {item.quantity} {showItemPrices && item.total !== undefined && `× ${formatMoney(item.subtotal, item.currency)}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discount Code Form */}
      {showDiscountForm && (
        <div className="mb-4 pb-4 border-b">
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
            <Button
              type="button"
              onClick={handleApplyDiscount}
              className="min-w-24 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-2 px-4 rounded"
              style={buttonStyle}
              disabled={isDiscountSubmitting || isEditor}
            >
              {isDiscountSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : discountCtaLabel}
            </Button>
          </div>}
          {errors.discount && <p className="text-sm text-red-500">{errors.discount}</p>}
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
        </div>
      )}

      {/* Order Summary Calculations */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span style={summaryTextStyle}>Subtotal</span>
          <span style={summaryTextStyle}>{formatMoney(session.subtotal, session.currency)}</span>
        </div>

        {session.shipping > 0 && (
          <div className="flex justify-between">
            <span style={summaryTextStyle}>Shipping</span>
            <span style={summaryTextStyle}>{formatMoney(session.shipping, session.currency)}</span>
          </div>
        )}


        {session.taxes > 0 && (
          <div className="flex justify-between">
            <span style={summaryTextStyle}>Taxes</span>
            <span style={summaryTextStyle}>{formatMoney(session.taxes, session.currency)}</span>
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
            }, 0), session.currency)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between font-semibold text-lg mt-4 pt-4 border-t">
        <span style={totalTextStyle}>Total</span>
        <span style={totalTextStyle}>{formatMoney(session.total, session.currency)}</span>
      </div>
    </div>
  );
}

export default CheckoutSummaryComponent;
