import Numi, { Appearance } from "@/contexts/Numi";
import { formatMoney } from "@/lib/utils";
import { BlockContextType } from "@/types/blocks";
import { useState, useEffect } from "react";

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
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

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

  return (
    <div className="border rounded-md p-4 bg-white shadow-sm">
      {/*<div className="text-xs bg-gray-100 p-1 mb-4 rounded">OrderSummaryComponent: {context.blockId}</div>*/}

      {/* Debug controls */}
      <div className="flex items-center space-x-2 mb-4 bg-gray-50 p-2 rounded text-sm">
        <span>showDiscountForm:</span>
        <span className={showDiscountForm ? "text-green-600 font-bold" : "text-red-600 font-bold"}>
          {showDiscountForm ? "TRUE" : "FALSE"}
        </span>
      </div>

      <h3 className="text-lg font-medium mb-4">{title}</h3>

      {/* Order Items */}
      <div className="space-y-3 mb-4">
        {session.line_items.map((item: any) => (
          <div key={item.id} className="flex items-center gap-3">
            {showImages && (
              <div className="w-12 h-12 border rounded flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-grow">
              <div className="flex justify-between">
                <div className="font-medium">{item.name}</div>
                {showItemPrices && item.price !== undefined && (
                  <div className="text-gray-700">{formatMoney(item.price * item.quantity, item.currency)}</div>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Qty: {item.quantity} {showItemPrices && item.price !== undefined && `× ${formatMoney(item.price, item.currency)}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discount Code Form */}
      {showDiscountForm && (
        <div className="mb-4 pb-4 border-b">
          <label htmlFor="discount-code" className="block text-sm mb-1">Discount code</label>
          <div className="flex gap-2">
            <input
              type="text"
              id="discount-code"
              className="border rounded p-2 text-sm flex-grow"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value)}
              placeholder="Enter discount code"
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm py-2 px-4 rounded"
            >
              Apply
            </button>
          </div>
        </div>
      )}

      {/* Order Summary Calculations */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(session.subtotal, session.currency)}</span>
        </div>

        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{formatMoney(session.shipping, session.currency)}</span>
        </div>

        <div className="flex justify-between">
          <span>Taxes</span>
          <span>{formatMoney(session.taxes, session.currency)}</span>
        </div>

        {session.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatMoney(session.discount, session.currency)}</span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between font-semibold text-lg mt-4 pt-4 border-t">
        <span>Total</span>
        <span>{formatMoney(session.total, session.currency)}</span>
      </div>
    </div>
  );
}

export default CheckoutSummaryComponent;
