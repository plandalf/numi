import Numi, { Appearance, Style } from "@/contexts/Numi";
import { cn, formatMoney } from "@/lib/utils";
import { BlockContextType } from "@/types/blocks";
import { useState, useEffect, useMemo } from "react";

function CheckoutSummaryComponent({ context }: { context: BlockContextType }) {

  const { session } = Numi.useCheckout({

  });

  const [title] = Numi.useStateString({
    label: 'Title',
    name: 'title',
    defaultValue: 'Order Summary',
  });

  const [showImages] = Numi.useStateBoolean({
    name: 'showImages',
    defaultValue: true,
    inspector: 'checkbox',
  });

  const [showItemPrices] = Numi.useStateBoolean({
    name: 'showItemPrices',
    defaultValue: true,
    inspector: 'checkbox',
  });

  const [discountCode, setDiscountCode] = Numi.useStateString({
    label: 'Discount Code',
    name: 'discountCode',
    defaultValue: '',
    inspector: 'hidden',
  });

  const [showDiscountForm, setShowDiscountForm] = Numi.useStateBoolean({
    name: 'showDiscountForm',
    defaultValue: true,
    inspector: 'checkbox',
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
    Style.textColor('titleColor', 'Title Color', {}, '#000000'),
    Style.font('titleFont', 'Title Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '900',
        size: '18px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('labelColor', 'Label Color', {}, '#000000'),
    Style.font( 'labelFont', 'Label Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('itemColor', 'Item Color', {}, '#000000'),
    Style.font( 'itemFont', 'Item Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('itemPriceColor', 'Item Price Color', {}, '#000000'),
    Style.font( 'itemPriceFont', 'Item Price Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('itemQuantityColor', 'Item Quantity Color', {}, '#6a7282'),
    Style.font( 'itemQuantityFont', 'Item Quantity Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('inputTextColor', 'Input Text Color', {}, '#000000'),
    Style.backgroundColor('inputBackgroundColor', 'Input Background Color', {}, '#FFFFFF'),
    Style.font('inputFont', 'Input Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('buttonTextColor', 'Button Text Color', {}, '#1e2939'),
    Style.backgroundColor('buttonBackgroundColor', 'Button Background Color', {}, '#f6f3f4'),
    Style.font( 'buttonTextFont', 'Button Text Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('summaryTextColor', 'Summary Text Color', {}, '#000000'),
    Style.font('summaryTextFont','Summary Text Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('discountTextColor', 'Discount Text Color', {}, '#00a63e'),
    Style.font('discountTextFont','Discount Text Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('totalTextColor', 'Total Text Color', {}, '#000000'),
    Style.font('totalTextFont', 'Total Text Font',
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
      borderRadius : style?.borderRadius ?? '3px',
      boxShadow: style?.shadow,
    };
  }, [style]);

  const { executeCallbacks } = Numi.useEventCallback({
    name: 'click',
  });

  const titleStyle = useMemo(() => {
    return {
      color: style.titleColor,
      fontFamily: style?.titleFont?.font,
      fontWeight: style?.titleFont?.weight,
      fontSize: style?.titleFont?.size,
      lineHeight: style?.titleFont?.lineHeight,
      letterSpacing: style?.titleFont?.letterSpacing,
    };
  }, [style.titleColor, style?.titleFont]);

  const labelStyle = useMemo(() => {
    return {
      color: style.labelColor,
      fontFamily: style?.labelFont?.font,
      fontWeight: style?.labelFont?.weight,
      fontSize: style?.labelFont?.size,
      lineHeight: style?.labelFont?.lineHeight,
      letterSpacing: style?.labelFont?.letterSpacing,
    };
  }, [style.labelColor, style?.labelFont]);

  const itemStyle = useMemo(() => {
    return {
      color: style.itemColor,
      fontFamily: style?.itemFont?.font,
      fontWeight: style?.itemFont?.weight,
      fontSize: style?.itemFont?.size,
      lineHeight: style?.itemFont?.lineHeight,
      letterSpacing: style?.itemFont?.letterSpacing,
    };
  }, [style.itemColor, style?.itemFont]);

  const itemPriceStyle = useMemo(() => {
    return {
      color: style.itemPriceColor,
      fontFamily: style?.itemPriceFont?.font,
      fontWeight: style?.itemPriceFont?.weight,
      fontSize: style?.itemPriceFont?.size,
      lineHeight: style?.itemPriceFont?.lineHeight,
      letterSpacing: style?.itemPriceFont?.letterSpacing,
    };
  }, [style.itemPriceColor, style?.itemPriceFont]);

  const itemQuantityStyle = useMemo(() => {
    return {
      color: style.itemQuantityColor,
      fontFamily: style?.itemQuantityFont?.font,
      fontWeight: style?.itemQuantityFont?.weight,
      fontSize: style?.itemQuantityFont?.size,
      lineHeight: style?.itemQuantityFont?.lineHeight,
      letterSpacing: style?.itemQuantityFont?.letterSpacing,
    };
  }, [style.itemQuantityColor, style?.itemQuantityFont]);

  const inputStyle = useMemo(() => {
    return {
      backgroundColor: style?.inputBackgroundColor,
      color: style.inputTextColor,
      fontFamily: style?.inputFont?.font,
      fontWeight: style?.inputFont?.weight,
      fontSize: style?.inputFont?.size,
      lineHeight: style?.inputFont?.lineHeight,
      letterSpacing: style?.inputFont?.letterSpacing,
    };
  }, [style.inputTextColor, style?.inputFont, style?.inputBackgroundColor]);

  const buttonStyle = useMemo(() => {
    return {
      color: style.buttonTextColor,
      backgroundColor: style.buttonBackgroundColor,
      fontFamily: style?.buttonTextFont?.font,
      fontWeight: style?.buttonTextFont?.weight,
      fontSize: style?.buttonTextFont?.size,
      lineHeight: style?.buttonTextFont?.lineHeight,
      letterSpacing: style?.buttonTextFont?.letterSpacing,
    };
  }, [style.buttonTextColor, style?.buttonTextFont, style?.buttonBackgroundColor]);

  const summaryTextStyle = useMemo(() => {
    return {
      color: style.summaryTextColor,
      fontFamily: style?.summaryTextFont?.font,
      fontWeight: style?.summaryTextFont?.weight,
      fontSize: style?.summaryTextFont?.size,
      lineHeight: style?.summaryTextFont?.lineHeight,
      letterSpacing: style?.summaryTextFont?.letterSpacing,
    };
  }, [style.summaryTextColor, style?.summaryTextFont]);

  const discountTextStyle = useMemo(() => {
    return {
      color: style.discountTextColor,
      fontFamily: style?.discountTextFont?.font,
      fontWeight: style?.discountTextFont?.weight,
      fontSize: style?.discountTextFont?.size,
      lineHeight: style?.discountTextFont?.lineHeight,
      letterSpacing: style?.discountTextFont?.letterSpacing,
    };
  }, [style.discountTextColor, style?.discountTextFont]);

  const totalTextStyle = useMemo(() => {
    return {
      color: style.totalTextColor,
      fontFamily: style?.totalTextFont?.font,
      fontWeight: style?.totalTextFont?.weight,
      fontSize: style?.totalTextFont?.size,
      lineHeight: style?.totalTextFont?.lineHeight,
      letterSpacing: style?.totalTextFont?.letterSpacing,
    };
  }, [style.totalTextColor, style?.totalTextFont]);

  // Debug: Log to see what's happening with the value
  console.log('showDiscountForm value:', showDiscountForm);
  console.log('blockConfig content:', context.blockConfig.content);

  const handleApplyDiscount = () => {
    // await this here,
    if (discountCode.trim()) {
      console.log('Applying discount:', discountCode);
      // Use the session context to apply the discount
      // This is a placeholder - you'll need to implement the actual discount application logic
      console.log('Discount code applied:', discountCode);
    }
  };

  console.log('session', session);

  if (style.hidden) {
    return null;
  }

  return (
    <div className="flex flex-col p-4'" style={containerStyle}>
      <h3 className="font-medium text-lg mb-4" style={titleStyle}>{title}</h3>
      {/* Order Items */}
      <div className="space-y-3 mb-4">
        {session.line_items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3">
            {showImages && item.image && (
              <div className="w-12 h-12 border rounded flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-grow">
              <div className="flex justify-between">
                <div className="font-medium" style={itemStyle}>{item.name}</div>
                {showItemPrices && item.price !== undefined && (
                  <div className="text-gray-700" style={itemPriceStyle}>{formatMoney(item.price * item.quantity, item.currency)}</div>
                )}
              </div>
              <div className="text-sm text-gray-500" style={itemQuantityStyle}>
                Qty: {item.quantity} {showItemPrices && item.price !== undefined && `× ${formatMoney(item.price, item.currency)}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discount Code Form */}
      {showDiscountForm && (
        <div className="mb-4 pb-4 border-b">
          <label htmlFor="discount-code" className="block mb-1" style={labelStyle}>Discount code</label>
          <div className="flex gap-2">
            <input
              type="text"
              id="discount-code"
              className="border bg-white rounded p-2 text-sm flex-grow"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Enter discount code"
              style={inputStyle}
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-2 px-4 rounded"
              style={buttonStyle}
            >
              Apply
            </button>
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

        {session.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span style={discountTextStyle}>Discount</span>
            <span style={discountTextStyle}>-{formatMoney(session.discount, session.currency)}</span>
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
