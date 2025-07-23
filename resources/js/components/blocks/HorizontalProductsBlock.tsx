import Numi, { Style, BlockContext, Appearance, FontValue, IconValue } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { useContext, useEffect, useMemo, useRef, useCallback } from "react";
import { get } from "lodash";
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
  const options = get(blockContext.blockConfig, `content.items`, defaultValue) as ProductItemType[];

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
    defaultValue,
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "array",
      items: {
        type: "object",
        properties: {
          key: {
            title: "Value",
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
    }
  });

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}, '0px'),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }, '16px'),
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
    Style.backgroundColor('checkColor', 'Check Color', {}, '#10B981'),
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
    Style.font('buttonFont', 'Button Font & Color', fontConfig, {
      size: '14px',
      weight: '500'
    }),
    Style.backgroundColor('buttonBackgroundColor', 'Button Background Color', {}, theme?.primary_color),
    Style.backgroundColor('buttonHoverBackgroundColor', 'Button Hover Background Color', {}, theme?.secondary_color),
    Style.borderRadius('buttonBorderRadius', 'Button Border Radius', {}, '6px'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const titleFont = {
    ...resolveThemeValue(style.titleFont, theme) as FontValue,
    color: resolveThemeValue(style.titleFont?.color, theme),
  };

  const descriptionFont = {
    ...resolveThemeValue(style.descriptionFont, theme) as FontValue,
    color: resolveThemeValue(style.descriptionFont?.color, theme),
  };

  const featuresFont = {
    ...resolveThemeValue(style.featuresFont, theme) as FontValue,
    color: resolveThemeValue(style.featuresFont?.color, theme),
  };

  const buttonFont = {
    ...resolveThemeValue(style.buttonFont, theme) as FontValue,
    color: resolveThemeValue(style.buttonFont?.color, theme),
  };

  const containerStyle = useMemo(() => ({
    padding: appearance.padding,
    margin: appearance.margin,
    gap: appearance.spacing,
  }), [appearance]);

  const itemStyle = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.backgroundColor, theme),
    borderColor: resolveThemeValue(style.borderColor, theme),
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius: style.borderRadius,
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  }), [style]);

  const selectedItemStyle = useMemo(() => ({
    ...itemStyle,
    borderColor: resolveThemeValue(style.highlightedBorderColor, theme),
  }), [itemStyle, style.highlightedBorderColor, theme]);

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

  const buttonStyle = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.buttonBackgroundColor, theme),
    color: resolveThemeValue(style.buttonFont?.color, theme, 'white'),
    fontSize: buttonFont?.size,
    fontWeight: buttonFont?.weight,
    fontFamily: buttonFont?.font,
    lineHeight: buttonFont?.lineHeight,
    letterSpacing: buttonFont?.letterSpacing,
    borderRadius: style.buttonBorderRadius,
    padding: '12px 24px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    marginTop: 'auto',
    width: '100%',
  }), [style, buttonFont]);

  const buttonHoverStyle = useMemo(() => ({
    ...buttonStyle,
    backgroundColor: resolveThemeValue(style.buttonHoverBackgroundColor, theme),
  }), [buttonStyle, style.buttonHoverBackgroundColor, theme]);

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
  }, [executeCallbacks, updateSessionProperties, context.blockId, selectedProduct]);

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
  }, [items, updateSelectedProductHook]);

  return (
    <div className="w-full" style={containerStyle}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items?.length || 1}, 1fr)` }}>
        {Array.isArray(items) && items.map((item) => {
          const isSelected = item.key === selectedProduct;
          
          return (
            <div
              key={item.key}
              className="flex flex-col"
              style={isSelected ? selectedItemStyle : itemStyle}
              onClick={() => handleProductSelect(item.key)}
            >
              {/* Check indicator at top */}
              <div style={isSelected ? selectedCheckStyle : checkStyle}>
                {isSelected && (
                  <Check size={16} color="white" />
                )}
              </div>

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
                style={isSelected ? buttonHoverStyle : buttonStyle}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = buttonStyle.backgroundColor;
                  }
                }}
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