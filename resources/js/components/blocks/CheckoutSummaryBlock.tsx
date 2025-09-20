import Numi, { Appearance, FontValue, Style } from "@/contexts/Numi";
import type { SubscriptionPreview } from "@/types/checkout";
import { resolveThemeValue } from "@/lib/theme";
import { formatMoney } from "@/lib/utils";
import { BlockContextType } from "@/types/blocks";
import { useState, useMemo } from "react";
import { Discount } from "@/types/product";
import { CircleAlert, Loader2, XIcon } from "lucide-react";
import { CheckoutItem } from "@/types/checkout";
import { Separator } from "../ui/separator";
import { MarkdownText } from "../ui/markdown-text";
import { OfferItemType } from "@/types/offer";

function CheckoutSummaryComponent({ context: _context }: { context: BlockContextType }) {
  void _context;
  const theme = Numi.useTheme();
  const checkoutCtx = Numi.useCheckout({});
  const {
    session,
    subscriptionPreview,
    addDiscount,
    removeDiscount,
    isEditor
  } = checkoutCtx;
  const preview = (checkoutCtx as unknown as { preview?: SubscriptionPreview }).preview;

  const [title] = Numi.useStateString({
    label: 'Title',
    name: 'title',
    defaultValue: 'Order Summary',
    nullable: true,
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

  const [discountCode, setDiscountCode] = useState(session.discount || '');

  const [stackedDiscounts] = Numi.useStateBoolean({
    label: 'Allow stacking discounts',
    name: 'stackedDiscounts',
    defaultValue: false,
    inspector: 'checkbox',
    group: 'discountCodes',
  });

  const [showDiscountForm] = Numi.useStateBoolean({
    label: 'Show discount form',
    name: 'showDiscountForm',
    defaultValue: true,
    inspector: 'checkbox',
    group: 'discountCodes',
  });

  const [discountCtaLabel] = Numi.useStateString({
    label: 'Label',
    name: 'discountCtaLabel',
    defaultValue: 'Apply',
    group: 'discountCodes',
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

  // Trial-aware helpers - moved to top level to avoid conditional hooks
  const isTrialCheckout = Boolean(session?.metadata?.isTrial);
  const isTrialExpansionCheckout = Boolean(session?.metadata?.isTrialExpansion);
  const isImmediateSwap = Boolean(session?.metadata?.isImmediateSwap);
  const isPeriodEndSwap = Boolean(session?.metadata?.isPeriodEndSwap);
  const isSkipTrial = Boolean(session?.metadata?.isSkipTrial);
  const isGenericPreview = Boolean(session?.metadata?.isGenericPreview);

  const priceTrialDays = useMemo(() => {
    try {
      const li = (session?.line_items || []).find((li: CheckoutItem) => {
        const p = li?.price as unknown as { type?: string; trial_period_days?: number };
        return p?.type !== 'one_time' && Number(p?.trial_period_days) > 0;
      });
      const p = li?.price as unknown as { trial_period_days?: number } | undefined;
      return p?.trial_period_days !== undefined ? Number(p.trial_period_days) : undefined;
    } catch {
      return undefined;
    }
  }, [session?.line_items]);

  const isTrialCheckoutUI = isTrialCheckout || (priceTrialDays !== undefined && priceTrialDays > 0);

  const trialStartIso = preview?.proposed?.trial_end || (session?.metadata?.billingStartDate as string | undefined);
  const postTrialAmount = preview?.invoice_preview?.next_period?.amount ?? (session?.metadata?.postTrialAmount as number | undefined);
  const swapAmount = session?.metadata?.swapAmount as number | undefined;
  const nextPeriodAmount = session?.metadata?.nextPeriodAmount as number | undefined;
  const skipAmount = session?.metadata?.skipAmount as number | undefined;
  const previewAmount = session?.metadata?.previewAmount as number | undefined;
  const effectiveDate = preview?.effective?.at || (session?.metadata?.effectiveDate as string | undefined);

  const trialStartDateLabel = useMemo(() => {
    if (trialStartIso) {
      try { return new Date(trialStartIso).toLocaleDateString(); } catch { /* ignore */ }
    }
    if (priceTrialDays && priceTrialDays > 0) {
      try { return new Date(Date.now() + priceTrialDays * 86400000).toLocaleDateString(); } catch { /* ignore */ }
    }
    return '';
  }, [trialStartIso, priceTrialDays]);

  const effectiveDateLabel = useMemo(() => {
    if (!effectiveDate) return '';
    try { return new Date(effectiveDate).toLocaleDateString(); } catch { return ''; }
  }, [effectiveDate]);

  const currency = useMemo(() => {
    if (showCurrency) {
      return session.currency;
    }
    return undefined;
  }, [session.currency, showCurrency]);

  // Removed unused baseRecurringItem after header copy cleanup

  const lineItems = useMemo(() => {
    const items = isImmediateSwap
      ? session.line_items.filter((li: CheckoutItem) => li.id > 0)
      : session.line_items;

    return items
      .sort((a: CheckoutItem, b: CheckoutItem) => {
        // Sort by type: 'standard' first, 'optional' last
        if (a.type === OfferItemType.STANDARD && b.type === OfferItemType.OPTIONAL) return -1;
        if (a.type === OfferItemType.OPTIONAL && b.type === OfferItemType.STANDARD) return 1;
        return 0;
      })
      .map((item: CheckoutItem) => {
        return {
          ...item,
        }
      });
  }, [session.line_items, isImmediateSwap]);

  const containerStyle = useMemo<React.CSSProperties>(() => ({
    backgroundColor: String(resolveThemeValue(style.backgroundColor, theme, 'primary_surface_color') ?? ''),
    padding: appearance.padding as React.CSSProperties['padding'],
    margin: appearance.margin as React.CSSProperties['margin'],
    gap: appearance.spacing as React.CSSProperties['gap'],
    borderColor: String(resolveThemeValue(style.borderColor, theme) ?? ''),
    borderWidth: style?.border?.width,
    borderStyle: style?.border?.style,
    borderRadius: (style?.borderRadius ?? '3px') as React.CSSProperties['borderRadius'],
    boxShadow: style?.shadow as React.CSSProperties['boxShadow'],
  }), [style]);

  const titleStyle = useMemo<React.CSSProperties>(() => ({
    color: String(resolveThemeValue(style.titleFont?.color, theme) ?? ''),
    fontFamily: style?.titleFont?.font,
    fontWeight: style?.titleFont?.weight as React.CSSProperties['fontWeight'],
    fontSize: style?.titleFont?.size,
    lineHeight: style?.titleFont?.lineHeight,
    letterSpacing: style?.titleFont?.letterSpacing,
  }), [style?.titleFont]);

  const labelStyle = useMemo<React.CSSProperties>(() => ({
    color: String(resolveThemeValue(style.labelFont?.color, theme) ?? ''),
    fontFamily: style?.labelFont?.font,
    fontWeight: style?.labelFont?.weight as React.CSSProperties['fontWeight'],
    fontSize: style?.labelFont?.size,
    lineHeight: style?.labelFont?.lineHeight,
    letterSpacing: style?.labelFont?.letterSpacing,
  }), [style?.labelFont]);

  const itemStyle = useMemo<React.CSSProperties>(() => ({
    color: String(resolveThemeValue(style.itemFont?.color, theme) ?? ''),
    fontFamily: style?.itemFont?.font,
    fontWeight: style?.itemFont?.weight as React.CSSProperties['fontWeight'],
    fontSize: style?.itemFont?.size,
    lineHeight: style?.itemFont?.lineHeight,
    letterSpacing: style?.itemFont?.letterSpacing,
  }), [style?.itemFont]);

  const itemPriceStyle = useMemo<React.CSSProperties>(() => ({
    color: String(resolveThemeValue(style.itemPriceFont?.color, theme) ?? ''),
    fontFamily: style?.itemPriceFont?.font,
    fontWeight: style?.itemPriceFont?.weight as React.CSSProperties['fontWeight'],
    fontSize: style?.itemPriceFont?.size,
    lineHeight: style?.itemPriceFont?.lineHeight,
    letterSpacing: style?.itemPriceFont?.letterSpacing,
  }), [style?.itemPriceFont]);

  const itemQuantityStyle = useMemo<React.CSSProperties>(() => ({
    color: String(resolveThemeValue(style.itemQuantityFont?.color, theme) ?? ''),
    fontFamily: style?.itemQuantityFont?.font,
    fontWeight: style?.itemQuantityFont?.weight as React.CSSProperties['fontWeight'],
    fontSize: style?.itemQuantityFont?.size,
    lineHeight: style?.itemQuantityFont?.lineHeight,
    letterSpacing: style?.itemQuantityFont?.letterSpacing,
  }), [style?.itemQuantityFont]);

  const inputStyle = useMemo<React.CSSProperties>(() => ({
    backgroundColor: String(resolveThemeValue(style.inputBackgroundColor, theme, 'secondary_surface_color') ?? ''),
    color: String(resolveThemeValue(style?.inputFont?.color, theme) ?? ''),
    fontFamily: style?.inputFont?.font,
    fontWeight: style?.inputFont?.weight as React.CSSProperties['fontWeight'],
    fontSize: style?.inputFont?.size,
    lineHeight: style?.inputFont?.lineHeight,
    letterSpacing: style?.inputFont?.letterSpacing,
    borderColor: String(resolveThemeValue(style.inputBorderColor, theme, 'primary_border_color') ?? ''),
    borderWidth: style?.inputBorder?.width,
    borderStyle: style?.inputBorder?.style,
  }), [style]);

  const buttonStyle = useMemo<React.CSSProperties>(() => {
    const buttonTextFont = {
      ...resolveThemeValue(style?.buttonTextFont, theme, 'body_typography') as FontValue,
      color: resolveThemeValue(style?.buttonTextFont?.color, theme, 'primary_contrast_color'),
    } as FontValue;
    return {
      color: String(resolveThemeValue(buttonTextFont?.color, theme) ?? ''),
      backgroundColor: String(resolveThemeValue(style.buttonBackgroundColor, theme, 'primary_color') ?? ''),
      fontFamily: buttonTextFont?.font,
      fontWeight: buttonTextFont?.weight,
      fontSize: buttonTextFont?.size,
      lineHeight: buttonTextFont?.lineHeight,
      letterSpacing: buttonTextFont?.letterSpacing,
      boxShadow: style?.buttonShadow,
    };
  }, [style?.buttonTextFont, style?.buttonBackgroundColor, style?.buttonShadow]);

  const summaryTextStyle = useMemo<React.CSSProperties>(() => ({
    color: String(resolveThemeValue(style.summaryTextFont?.color, theme) ?? ''),
    fontFamily: style?.summaryTextFont?.font,
    fontWeight: style?.summaryTextFont?.weight as React.CSSProperties['fontWeight'],
    fontSize: style?.summaryTextFont?.size,
    lineHeight: style?.summaryTextFont?.lineHeight,
    letterSpacing: style?.summaryTextFont?.letterSpacing,
  }), [style?.summaryTextFont]);

  const discountTextStyle = useMemo<React.CSSProperties>(() => ({
    color: String(resolveThemeValue(style?.discountTextFont?.color, theme) ?? ''),
    fontFamily: style?.discountTextFont?.font,
    fontWeight: style?.discountTextFont?.weight as React.CSSProperties['fontWeight'],
    fontSize: style?.discountTextFont?.size,
    lineHeight: style?.discountTextFont?.lineHeight,
    letterSpacing: style?.discountTextFont?.letterSpacing,
  }), [style?.discountTextFont]);

  const totalTextStyle = useMemo<React.CSSProperties>(() => ({
    color: String(resolveThemeValue(style?.totalTextFont?.color, theme) ?? ''),
    fontFamily: style?.totalTextFont?.font,
    fontWeight: style?.totalTextFont?.weight as React.CSSProperties['fontWeight'],
    fontSize: style?.totalTextFont?.size,
    lineHeight: style?.totalTextFont?.lineHeight,
    letterSpacing: style?.totalTextFont?.letterSpacing,
  }), [style?.totalTextFont]);

  const dividerStyle = useMemo<React.CSSProperties>(() => ({
    backgroundColor: String(resolveThemeValue(style.dividerColor, theme, 'primary_border_color') ?? ''),
  }), [style]);

  const summaryContainerStyle = useMemo<React.CSSProperties>(() => ({
    gap: appearance.summarySpacing as React.CSSProperties['gap'],
  }), [appearance.summarySpacing]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isDiscountSubmitting, setIsDiscountSubmitting] = useState(false);

  const handleApplyDiscount = () => {
    // await this here,
    if (discountCode.trim()) {
      setIsDiscountSubmitting(true);
      addDiscount(discountCode).then((status: { success: boolean, message: string }) => {
        console.log('addDiscount', status);
        if (status && status.success) {
          setDiscountCode('');
          setErrors({ ...errors, discount: '' });
        } else {
          setErrors({ discount: status.message || 'Failed to apply discount' });
        }
      }).catch(e => {
        console.error('addDiscount error', e);
      }).finally(() => {
        setIsDiscountSubmitting(false);
      });
    }
  };

  const handleRemoveDiscount = (discount: string) => {
    removeDiscount(discount).then((status: boolean) => {
      if (status) {
        setErrors({ ...errors, discount: '' });
      } else {
        setErrors({ discount: 'Failed to remove discount' });
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

  const LineItem = ({ item }: { item: CheckoutItem }) => {
    // Determine if this is a preview line item (negative ID)
    const isPreviewItem = item.id < 0;
    const trialDays = session?.metadata?.trialDays as number | undefined;
    const billingStartDate = session?.metadata?.billingStartDate as string | undefined;

    return (<div className="flex-grow overflow-hidden">
      <div className="flex justify-between items-center gap-4">
        <div
          className="font-medium break-all"
          style={itemStyle}
        >
          {item.price?.name}
          {isTrialCheckoutUI && (
            <div className="text-sm text-emerald-600 font-normal">
              {(trialDays || priceTrialDays) ? `${(trialDays || priceTrialDays)}-day free trial` : 'Free trial'}
            </div>
          )}
          {isTrialExpansionCheckout && (
            <div className="text-sm text-emerald-600 font-normal">
              Trial expansion
            </div>
          )}
          {isImmediateSwap && isPreviewItem && (
            <div className="text-sm text-blue-600 font-normal">
              Immediate plan change
            </div>
          )}
          {isPeriodEndSwap && (
            <div className="text-sm text-blue-600 font-normal">
              Plan change at period end
            </div>
          )}
          {isPeriodEndSwap && subscriptionPreview?.current?.base_item?.quantity !== subscriptionPreview?.proposed?.base_item?.quantity && (
            <div className="text-sm text-blue-600 font-normal">
              Quantity: {subscriptionPreview?.current?.base_item?.quantity} → {subscriptionPreview?.proposed?.base_item?.quantity}
            </div>
          )}
          {isSkipTrial && (
            <div className="text-sm text-orange-600 font-normal">
              Skip trial
            </div>
          )}
          {isGenericPreview && isPreviewItem && (
            <div className="text-sm text-gray-600 font-normal">
              Plan change adjustment
            </div>
          )}
        </div>
        {showItemPrices && item.total !== undefined && (
          <>
            {item?.is_highlighted ?
              // Use H3 styling for highlighted items
              <MarkdownText
                theme={theme}
                text={`### ${formatMoney(item.total, currency)}`}
                className="text-gray-700"
              />
            :
            <div className="text-gray-700" style={itemPriceStyle}>
              {isTrialCheckoutUI ? (
                <div className="text-right">
                  <div className="text-gray-800">{formatMoney(item.total, currency)}</div>
                  <div className="text-sm text-gray-500">
                    Billing starts{trialStartDateLabel ? `: ${trialStartDateLabel}` : ''}
                  </div>
                </div>
              ) : isTrialExpansionCheckout ? (
                <div className="text-right">
                  <div className="text-emerald-600">Free during trial</div>
                  <div className="text-sm text-gray-500">
                    Then {formatMoney(postTrialAmount || item.total, currency)}/{item.price?.renew_interval}
                  </div>
                </div>
              ) : isImmediateSwap && isPreviewItem ? (
                <div className="text-right">
                  <div className="text-blue-600">{formatMoney(item.total, currency)}</div>
                  <div className="text-sm text-gray-500">Due now</div>
                </div>
              ) : isPeriodEndSwap ? (
                <div className="text-right">
                  <div className="text-blue-600">No charge now</div>
                  <div className="text-sm text-gray-500">
                    {effectiveDateLabel ? `Changes ${effectiveDateLabel}` : 'Changes at period end'}
                  </div>
                </div>
              ) : isSkipTrial ? (
                <div className="text-right">
                  <div className="text-orange-600">{formatMoney(item.total, currency)}</div>
                  <div className="text-sm text-gray-500">Skip trial</div>
                </div>
              ) : isGenericPreview && isPreviewItem ? (
                <div className="text-right">
                  <div className="text-gray-600">{formatMoney(item.total, currency)}</div>
                  <div className="text-sm text-gray-500">Adjustment</div>
                </div>
              ) : (
                formatMoney(item.total, currency)
              )}
            </div>
            }
          </>
        )}
      </div>
      <div className="leading-tight text-sm text-gray-500">
        {showQuantity && item.price?.type === 'one_time' && (
          <div style={itemQuantityStyle}>
            Qty: {item.quantity} {showItemPrices && item.total !== undefined && `× ${formatMoney(item.subtotal, currency)}`}
          </div>
        )}
        {item.price && item.price.type !== 'one_time' && (
          <>
            {isTrialCheckoutUI ? null : isTrialExpansionCheckout ? (
              <div style={itemQuantityStyle}>
                <div>Billing starts: {billingStartDate ? new Date(billingStartDate).toLocaleDateString() : 'After trial'}</div>
                <div>Price per {item.price.renew_interval}: {formatMoney(postTrialAmount || item.total, currency)}</div>
              </div>
            ) : isPeriodEndSwap ? (
              <div style={itemQuantityStyle}>
                <div>Current price: {formatMoney(session.metadata?.currentAmount || item.total, currency)}/{item.price.renew_interval}</div>
                <div>New price: {formatMoney(nextPeriodAmount || item.total, currency)}/{item.price.renew_interval}</div>
              </div>
            ) : (
              <>
                <div style={itemQuantityStyle}>Price per {item.price.renew_interval}: {formatMoney(item.total, currency)}</div>
                {item.price.cancel_after_cycles && (
                   <div>Total ({item.price.cancel_after_cycles} {item.price.renew_interval}s): {formatMoney(item.price.cancel_after_cycles * item.total, currency)}</div>
                 )}
              </>
            )}
           </>
        )}
      </div>
    </div>)
  }

  return (
    <div className="flex flex-col p-4 gap-4" style={containerStyle}>
      {title && <h3 className="font-medium text-lg" style={titleStyle}>{title}</h3>}

      {/* Order Items */}
      <div className="space-y-3 overflow-y-auto h-auto max-h-[300px]">
        {lineItems.length === 0 && (
          <div className="flex gap-3 border border-destructive text-destructive rounded-md p-4 mt-3.5">
            <CircleAlert className="w-5 h-5 mt-0.5" />
            No items to checkout
          </div>
        )}
        {lineItems.map((item: CheckoutItem) => (
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
      {/* Immediate swap highlights: concise proration summary */}
      {isImmediateSwap && subscriptionPreview && (
        (() => {
          const preview = subscriptionPreview as unknown as { invoice_preview?: { lines?: Array<{ amount?: number; proration?: boolean }> }, delta?: { total_due_at_effective?: number } };
          const lines = preview?.invoice_preview?.lines as Array<{ amount?: number; proration?: boolean }> | undefined;
          const proration = Array.isArray(lines) ? lines.filter(l => l?.proration) : [];
          const credit = proration.find(l => (l?.amount ?? 0) < 0);
          const charge = proration.find(l => (l?.amount ?? 0) > 0);
          const dueNow = (swapAmount ?? preview?.delta?.total_due_at_effective) as number | undefined;

          return (
            <div className="space-y-2 text-sm">
              {(credit || charge) && (
                <>
                  {credit && (
                    <div className="flex justify-between">
                      <span style={summaryTextStyle}>Credit for unused time</span>
                      <span style={summaryTextStyle}>-{formatMoney(Math.abs(credit.amount || 0), currency)}</span>
                    </div>
                  )}
                  {charge && (
                    <div className="flex justify-between">
                      <span style={summaryTextStyle}>Charge for remaining time</span>
                      <span style={summaryTextStyle}>{formatMoney(charge.amount || 0, currency)}</span>
                    </div>
                  )}
                </>
              )}
              {typeof dueNow === 'number' && (
                <div className="flex justify-between">
                  <span style={summaryTextStyle}>Plan change fee</span>
                  <span style={summaryTextStyle}>{formatMoney(dueNow, currency)}</span>
                </div>
              )}
              {/*{nextPeriod && typeof nextPeriod.amount === 'number' && (*/}
              {/*  <div className="flex justify-between text-gray-600">*/}
              {/*    <span style={summaryTextStyle}>Next period total</span>*/}
              {/*    <span style={summaryTextStyle}>{formatMoney(nextPeriod.amount, currency)}</span>*/}
              {/*  </div>*/}
              {/*)}*/}
            </div>
          );
        })()
      )}
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
      {!isImmediateSwap && (showSubtotal ||
        (showShipping && session.shipping > 0) ||
        (showTaxes && session.inclusive_taxes > 0 && session.subtotal > 0 && !isTrialCheckoutUI && !isTrialExpansionCheckout && !isPeriodEndSwap) ||
        (session.discounts && session.discounts.length > 0)
      ) && (
        <div className="space-y-2 text-sm flex flex-col" style={summaryContainerStyle}>
          {showSubtotal && <div className="flex justify-between">
            <span style={summaryTextStyle}>Subtotal</span>
            <span style={summaryTextStyle}>{formatMoney(isTrialCheckoutUI || isTrialExpansionCheckout || isPeriodEndSwap ? 0 : session.subtotal, currency)}</span>
          </div>}

          {showShipping && session.shipping > 0 && (
            <div className="flex justify-between">
              <span style={summaryTextStyle}>Shipping</span>
              <span style={summaryTextStyle}>{formatMoney(session.shipping, currency)}</span>
            </div>
          )}


          {showTaxes && (session.inclusive_taxes) > 0 && session.subtotal > 0 && !isTrialCheckoutUI && !isTrialExpansionCheckout && !isPeriodEndSwap && (
            <div className="flex justify-between">
              <span style={summaryTextStyle}>{taxesLabel}</span>
              <span style={summaryTextStyle}>
                {formatMoney(session.inclusive_taxes, currency)}
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
                  return acc + ((isTrialCheckout || isTrialExpansionCheckout || isPeriodEndSwap ? 0 : session.subtotal) * (discount.percent_off / 100));
                }
                return acc;
              }, 0), currency)}</span>
            </div>
          )}
        </div>
      )}

      <Separator style={dividerStyle} />
      {/* Total */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between font-semibold text-lg">
          <span style={totalTextStyle}>
            {isTrialCheckoutUI || isTrialExpansionCheckout ? 'Total Due Today' :
             isPeriodEndSwap ? 'Total Due Today' :
             isImmediateSwap ? 'Total Due Now' :
             isSkipTrial ? 'Total Due Now' :
             isGenericPreview ? 'Total Due Now' :
             'Total Due Today'}
          </span>
          <span style={totalTextStyle}>
            {formatMoney(
              isTrialCheckoutUI || isTrialExpansionCheckout || isPeriodEndSwap
                ? 0
                : (isImmediateSwap && swapAmount !== undefined ? swapAmount : session.total),
              currency
            )}
          </span>
        </div>

        {/* Additional total information for different scenarios */}
        {(isTrialCheckout || isTrialExpansionCheckout) && postTrialAmount !== undefined && (
          <div className="flex justify-between text-sm">
            <span style={summaryTextStyle}>Total due{trialStartDateLabel ? `: ${trialStartDateLabel}` : ''}</span>
            <span style={summaryTextStyle}>{formatMoney(postTrialAmount, currency)}</span>
          </div>
        )}

        {isPeriodEndSwap && nextPeriodAmount !== undefined && (
          <div className="flex justify-between text-sm">
            <span style={summaryTextStyle}>Next period total{effectiveDateLabel ? `: ${effectiveDateLabel}` : ''}</span>
            <span style={summaryTextStyle}>{formatMoney(nextPeriodAmount, currency)}</span>
          </div>
        )}

        {isImmediateSwap && swapAmount !== undefined && (
          <div className="flex justify-between text-sm">
            <span style={summaryTextStyle}>Plan change fee</span>
            <span style={summaryTextStyle}>{formatMoney(swapAmount, currency)}</span>
          </div>
        )}

        {isSkipTrial && skipAmount !== undefined && (
          <div className="flex justify-between text-sm">
            <span style={summaryTextStyle}>Skip trial fee</span>
            <span style={summaryTextStyle}>{formatMoney(skipAmount, currency)}</span>
          </div>
        )}

        {isGenericPreview && previewAmount !== undefined && (
          <div className="flex justify-between text-sm">
            <span style={summaryTextStyle}>Adjustment total{effectiveDateLabel ? `: ${effectiveDateLabel}` : ''}</span>
            <span style={summaryTextStyle}>{formatMoney(previewAmount, currency)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CheckoutSummaryComponent;
