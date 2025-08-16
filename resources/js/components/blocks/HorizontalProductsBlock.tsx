import Numi, { Style, BlockContext, Appearance, FontValue, JSONSchemaValue } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { useContext, useEffect, useMemo, useRef, useCallback } from "react";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { resolveThemeValue } from "@/lib/theme";
import { Check } from "lucide-react";
import { MarkdownText } from "../ui/markdown-text";

// Define interfaces for the item structure
interface ProductItemType {
  key: string;
  title: string;
  value: string;
  description: string;
  features: string;
  buttonText?: string;
}

function HorizontalProductsComponent({ context }: { context: BlockContextType }) {
  const { updateSessionProperties } = Numi.useCheckout({});
  const theme = Numi.useTheme();

  const defaultValue = [{
    key: 'basic',
    title: 'Basic Plan',
    value: 'basic',
    description: 'Perfect for getting started',
    features: '- Feature 1\n- Feature 2\n- Feature 3',
    buttonText: 'Get Started',
  }, {
    key: 'pro',
    title: 'Pro Plan',
    value: 'pro',
    description: 'For growing businesses',
    features: '- All Basic features\n- Pro feature 1\n- Pro feature 2\n- Priority support',
    buttonText: 'Choose Pro',
  }, {
    key: 'enterprise',
    title: 'Enterprise',
    value: 'enterprise',
    description: 'For large organizations',
    features: '- All Pro features\n- Enterprise feature 1\n- Enterprise feature 2\n- Dedicated support\n- Custom integrations',
    buttonText: 'Contact Sales',
  }];

  const blockContext = useContext(BlockContext);
  const options = (blockContext?.blockConfig?.content?.items ?? defaultValue) as ProductItemType[];

  const [selectedProduct, setSelectedProduct, updateSelectedProductHook] = Numi.useStateEnumeration({
    name: 'value',
    initialValue: options[0]?.key ?? undefined,
    options: Array.isArray(options) ? options?.filter((item) => item.key).map((item) => item.key) : [],
    inspector: 'select',
    label: 'Default (Selected Product)',
    asState: true,
  });

  const [items] = Numi.useStateJsonSchema({
    name: 'items',
    label: 'Items',
    defaultValue,
    schema: ({
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "array",
      items: {
        type: "object",
        properties: {
          key: {
            type: "string",
          },
          title: {
            title: "Label",
            type: "string"
          },
          value: {
            title: "Value",
            type: "string"
          },
          description: {
            title: "Description",
            type: "string"
          },
          features: {
            title: "Features List",
            type: "string",
            meta: { editor: "markdown" },
          },
          buttonText: {
            title: "Button Text",
            type: "string"
          }
        },
        required: ["key", "title", "value", "description", "features"]
      }
    } as unknown) as JSONSchemaValue
  });

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}, '0px'),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }, '12px'),
    Appearance.padding('buttonPadding', 'Button Padding', {}, '7px'),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const fontConfig = {
    config: {
      hideVerticalAlignment: true,
      hideHorizontalAlignment: true,
    },
  };

  const style = Numi.useStyle([
    Style.backgroundColor('backgroundColor', 'Item Background Color', {}, '#FFFFFF'),
    Style.border('border', 'Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, theme?.border_radius),
    Style.borderColor('borderColor', 'Border Color', {}, 'transparent'),
    Style.borderColor('highlightedBorderColor', 'Highlighted Border Color', {}, theme?.secondary_color),
    Style.backgroundColor('checkboxActiveBackgroundColor', 'Check Color', {}, '#10B981'),
    Style.textColor('badgeTextColor', 'Tag Text Color', {}, theme?.primary_contrast_color),
    Style.backgroundColor('badgeBackgroundColor', 'Tag Background Color', {}, theme?.secondary_color),
    Style.hidden('showIndicator', 'Show Selection Indicator', {}, false),
    Style.alignment('titleAlignment', 'Label Alignment', {
      options: {
        start: 'start',
        center: 'center',
        end: 'end',
      },
    }, 'center'),
    Style.font('titleFont', 'Label Font & Color', fontConfig, {
      size: '18px',
      weight: '600'
    }),
    Style.font('descriptionFont', 'Description Font & Color', fontConfig, {
      size: '14px',
      weight: '400'
    }),
    Style.font('featuresFont', 'Features Font & Color', fontConfig, {
      size: '14px',
      weight: '400'
    }),
    // Use a text spacing value for list item gap control
    Style.textColor('featuresListGap', 'Features List Item Gap', { inspector: 'spacingPicker' }, '6px'),
    Style.font('buttonFont', 'Button Font & Color', fontConfig, {
      size: '14px',
      weight: '500'
    }),
    Style.backgroundColor('buttonBackgroundColor', 'Button Background Color', {}, theme?.primary_color),
    Style.backgroundColor('activeBackgroundColor', 'Button Active Background Color', {}, theme?.secondary_color),
    Style.borderRadius('buttonBorderRadius', 'Button Border Radius', {}, '6px'),
    // Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const titleFont = {
    ...resolveThemeValue(style.titleFont, theme) as FontValue,
    color: resolveThemeValue(style.titleFont?.color, theme) as string,
  };

  const descriptionFont = {
    ...resolveThemeValue(style.descriptionFont, theme) as FontValue,
    color: resolveThemeValue(style.descriptionFont?.color, theme) as string,
  };

  const featuresFont = {
    ...resolveThemeValue(style.featuresFont, theme) as FontValue,
    color: resolveThemeValue(style.featuresFont?.color, theme) as string,
  };

  const buttonFont = useMemo(() => ({
    ...resolveThemeValue(style.buttonFont, theme) as FontValue,
    color: resolveThemeValue(style.buttonFont?.color, theme) as string,
  }), [style.buttonFont, theme]);

  const containerStyle = useMemo(() => ({
    padding: String(appearance.padding ?? '0px'),
    margin: String(appearance.margin ?? '0px'),
    gap: String(appearance.spacing ?? '12px'),
  }) as React.CSSProperties, [appearance]);

  const itemStyle = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.backgroundColor, theme) as string,
    borderColor: resolveThemeValue(style.borderColor, theme) as string,
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius: style.borderRadius,
    padding: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  }) as React.CSSProperties, [style, theme]);

  const selectedItemStyle = useMemo(() => ({
    ...itemStyle,
    borderColor: resolveThemeValue(style.highlightedBorderColor, theme) as string,
  }) as React.CSSProperties, [itemStyle, style.highlightedBorderColor, theme]);

  const checkColor = resolveThemeValue(style.checkColor, theme, 'secondary_color') as string;

  const checkStyle = useMemo(() => ({
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: `2px solid ${checkColor}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    alignSelf: 'flex-start',
    marginBottom: '16px',
  }), [checkColor]);

  const selectedCheckStyle = useMemo(() => ({
    ...checkStyle,
    backgroundColor: checkColor,
    border: `2px solid ${checkColor}`,
  }), [checkStyle, checkColor]);

  const showIndicator = (style as Record<string, unknown>)?.showIndicator !== false;

  const buttonVars = useMemo(() => {
    const resolvedBg = resolveThemeValue(style.buttonBackgroundColor, theme) as string;
    const resolvedText = (resolveThemeValue(style.buttonFont?.color, theme) as string) ?? '#FFFFFF';

    const isColorWhite = (value?: string) => {
      if (!value) return true;
      const v = String(value).toLowerCase().replace(/\s+/g, '');
      return (
        v === 'white' || v === '#fff' || v === '#ffffff' ||
        v.startsWith('rgb(255,255,255') || v.startsWith('hsl(0,0%100%)') || v.startsWith('hsl(0,0%,100%)') ||
        v.startsWith('oklch(1')
      );
    };

    const defaultSurface = '#189AB4';
    const defaultBorder = '#007D96';
    const effectiveBg = isColorWhite(resolvedBg) ? defaultSurface : resolvedBg;
    const effectiveBorder = isColorWhite(resolvedBg) ? defaultBorder : (resolvedBg || defaultBorder);
    const effectiveText = isColorWhite(resolvedText) && isColorWhite(resolvedBg) ? '#ffffff' : resolvedText;

    const vars: React.CSSProperties = {
      '--btn-bg': effectiveBg,
      '--btn-hover-overlay': 'rgb(255 255 255 / 0.08)',
      '--btn-border': effectiveBorder,
      '--btn-icon': effectiveText,
      '--radius-lg': (style.buttonBorderRadius as string) ?? '8px',
      color: effectiveText,
      fontSize: buttonFont?.size,
      fontWeight: buttonFont?.weight,
      fontFamily: buttonFont?.font,
      lineHeight: buttonFont?.lineHeight,
      letterSpacing: buttonFont?.letterSpacing,
      marginTop: 'auto',
      width: '100%',
    } as React.CSSProperties;

    return vars;
  }, [style.buttonBackgroundColor, style.buttonFont, style.buttonBorderRadius, theme, buttonFont]);

  const activeButtonVars = useMemo(() => {
    const resolvedBg = resolveThemeValue(style.activeBackgroundColor, theme) as string;
    const resolvedText = (resolveThemeValue(style.buttonFont?.color, theme) as string) ?? '#FFFFFF';

    const isColorWhite = (value?: string) => {
      if (!value) return true;
      const v = String(value).toLowerCase().replace(/\s+/g, '');
      return (
        v === 'white' || v === '#fff' || v === '#ffffff' ||
        v.startsWith('rgb(255,255,255') || v.startsWith('hsl(0,0%100%)') || v.startsWith('hsl(0,0%,100%)') ||
        v.startsWith('oklch(1')
      );
    };

    const defaultSurface = '#189AB4';
    const defaultBorder = '#007D96';
    const effectiveBg = isColorWhite(resolvedBg) ? defaultSurface : resolvedBg;
    const effectiveBorder = isColorWhite(resolvedBg) ? defaultBorder : (resolvedBg || defaultBorder);
    const effectiveText = isColorWhite(resolvedText) && isColorWhite(resolvedBg) ? '#ffffff' : resolvedText;

    const vars: React.CSSProperties = {
      ...buttonVars,
      '--btn-bg': effectiveBg,
      '--btn-border': effectiveBorder,
      color: effectiveText,
    } as React.CSSProperties;

    return vars;
  }, [style.activeBackgroundColor, style.buttonFont, theme, buttonVars]);

  const interactionElements = useMemo(() => {
    return Array.isArray(items) ? items.filter(item => item.key).map(item => ({ value: item.key, label: item.title })) : [];
  }, [items]);

  const { executeCallbacks, updateHook: updateEventCallbackHook } = Numi.useEventCallback({
    name: 'onClick',
    elements: interactionElements,
    events: [{
      label: EVENT_LABEL_MAP[Event.onClick],
      events: [Event.onClick],
    }]
  });

  const handleProductSelect = useCallback((value: string) => {
    setSelectedProduct(value);
    executeCallbacks(Event.onClick, value);
    updateSessionProperties(context.blockId, value);
  }, [executeCallbacks, updateSessionProperties, context.blockId, setSelectedProduct]);

  const prevItemsRef = useRef(items);

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;

    const prevItems = prevItemsRef.current;
    // Only update if the items have actually changed
    if (JSON.stringify(items) !== JSON.stringify(prevItems)) {
      updateSelectedProductHook({ options: items });
      updateEventCallbackHook({ options: interactionElements });

      prevItemsRef.current = items;
    }
  }, [items, updateSelectedProductHook, updateEventCallbackHook, interactionElements]);

  return (
    <div className="w-full" style={containerStyle}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items?.length || 1}, 1fr)` }}>
        {Array.isArray(items) && items.map((item) => {
          const isSelected = item.key === selectedProduct;
          
          return (
            <div
              key={item.key}
              className="flex flex-col rounded-xl hover:bg-black/5 dark:hover:bg-white/5 hover:shadow-sm transition-all relative"
              style={isSelected ? (selectedItemStyle as React.CSSProperties) : (itemStyle as React.CSSProperties)}
              onClick={() => handleProductSelect(item.key)}
            >
              {/* Tag badge */}
              { (item as { tag?: string }).tag && (
                <span
                  className="absolute top-2 right-2 px-2 py-1 text-[11px] font-medium rounded-full"
                  style={{
                    backgroundColor: resolveThemeValue(style.badgeBackgroundColor, theme) as string,
                    color: resolveThemeValue(style.badgeTextColor, theme) as string,
                  } as React.CSSProperties}
                >
                  {(item as { tag?: string }).tag as string}
                </span>
              )}

              {/* Check indicator at top */}
              {showIndicator && (
                <div style={isSelected ? (selectedCheckStyle as React.CSSProperties) : (checkStyle as React.CSSProperties)}>
                  {isSelected && (
                    <Check size={16} color="white" />
                  )}
                </div>
              )}

              {/* Label */}
              <div
                style={{
                  color: titleFont?.color,
                  fontSize: titleFont?.size,
                  fontWeight: titleFont?.weight,
                  fontFamily: titleFont?.font,
                  lineHeight: titleFont?.lineHeight,
                  letterSpacing: titleFont?.letterSpacing,
                  textAlign: style.titleAlignment,
                  marginBottom: '16px',
                }}
              >
                {item.title}
              </div>

              {/* Features list */}
              <div
                style={{
                  color: featuresFont?.color,
                  fontSize: featuresFont?.size,
                  fontWeight: featuresFont?.weight,
                  fontFamily: featuresFont?.font,
                  lineHeight: featuresFont?.lineHeight,
                  letterSpacing: featuresFont?.letterSpacing,
                  marginBottom: '16px',
                  flex: 1,
                }}
              >
                <MarkdownText
                  text={item.features}
                  style={featuresFont}
                  listItemGap={resolveThemeValue(style.featuresListGap, theme) as string}
                  theme={theme}
                />
              </div>

              {/* Description */}
              <div
                style={{
                  color: descriptionFont?.color,
                  fontSize: descriptionFont?.size,
                  fontWeight: descriptionFont?.weight,
                  fontFamily: descriptionFont?.font,
                  lineHeight: descriptionFont?.lineHeight,
                  letterSpacing: descriptionFont?.letterSpacing,
                  textAlign: 'center',
                  marginBottom: '16px',
                }}
              >
                {item.description}
              </div>

              {/* Select button */}
              <button
                className={[
                  'cursor-pointer relative isolate inline-flex items-center justify-center gap-x-2 overflow-hidden',
                  'rounded-[var(--radius-lg)] border text-base/6 font-semibold whitespace-nowrap',
                  'transition-[background,color,box-shadow,opacity] duration-200 ease-in-out',
                  "before:content-[''] after:content-['']",
                  'border-transparent bg-(--btn-border)',
                  'before:absolute before:inset-0 before:-z-10 before:rounded-[calc(var(--radius-lg)-1px)] before:bg-(--btn-bg) before:opacity-90 hover:before:opacity-100 active:before:opacity-95 before:shadow-sm',
                  'dark:border-white/5',
                  'after:absolute after:inset-0 after:-z-10 after:rounded-[calc(var(--radius-lg)-1px)] after:shadow-[inset_0_1px_theme(colors.white/15%)] data-active:after:bg-(--btn-hover-overlay) data-hover:after:bg-(--btn-hover-overlay) dark:after:-inset-px dark:after:rounded-lg data-disabled:before:shadow-none data-disabled:after:shadow-none',
                  'w-full justify-center',
                  isSelected ? 'opacity-80 cursor-default' : '',
                ].join(' ')}
                style={{ ...(isSelected ? activeButtonVars : buttonVars), padding: String(appearance.buttonPadding ?? '7px'), minHeight: '40px' }}
                data-disabled={isSelected ? true : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  handleProductSelect(item.key);
                }}
              >
                {isSelected ? 'Selected' : (item.buttonText || 'Select Plan')}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default HorizontalProductsComponent; 