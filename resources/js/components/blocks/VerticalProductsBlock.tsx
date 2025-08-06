import Numi, { Style, BlockContext, Appearance, FontValue, IconValue } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { useContext, useEffect, useMemo, useRef, useCallback } from "react";
import get from "lodash/get";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { resolveThemeValue } from "@/lib/theme";
import { Check } from "lucide-react";
import { IconRenderer } from "../ui/icon-renderer";

// Define interfaces for the item structure
interface ProductItemType {
  key: string;
  icon?: IconValue;
  title: string;
  value: string;
  description: string;
}

function VerticalProductsComponent({ context }: { context: BlockContextType }) {
  const { updateSessionProperties } = Numi.useCheckout({});
  const theme = Numi.useTheme();

  const defaultValue = [{
    key: 'basic',
    icon: { icon: null, emoji: '🚀', url: null },
    title: 'Basic Plan',
    value: 'basic',
    description: 'Perfect for getting started',
  }, {
    key: 'pro',
    icon: { icon: null, emoji: '⚡', url: null },
    title: 'Pro Plan',
    value: 'pro',
    description: 'For growing businesses',
  }, {
    key: 'enterprise',
    icon: { icon: null, emoji: '🏢', url: null },
    title: 'Enterprise',
    value: 'enterprise',
    description: 'For large organizations',
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
          icon: {
            title: 'Icon',
            type: "object",
            defaultValue: { icon: null, emoji: null, url: null } as IconValue,
            meta: { editor: "iconSelector" },
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
          }
        },
        required: ["key", "title", "value", "description"]
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
    Style.font('titleFont', 'Label Font & Color', fontConfig, {
      size: '16px',
      weight: '600'
    }),
    Style.font('descriptionFont', 'Description Font & Color', fontConfig, {
      size: '14px',
      weight: '400'
    }),
    Style.dimensions('iconSize', 'Icon Size', {
      config: {
        hideWidth: true
      }
    }, { width: '20px', height: '20px' }),
    Style.textColor('iconColor', 'Icon Color', {}, theme?.primary_color),
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

  const iconStyle = useMemo(() => ({
    alignSelf: 'start' as const,
    color: resolveThemeValue(style.iconColor, theme, 'primary_color'),
    height: style.iconSize?.height ?? '20px',
    width: 'auto',
  }), [style, theme]);

  const containerStyle = useMemo(() => ({
    margin: appearance.margin,
    gap: appearance.spacing,
  }), [appearance]);

  const itemStyle = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.backgroundColor, theme),
    borderColor: resolveThemeValue(style.borderColor, theme),
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius: style.borderRadius,
    padding: appearance.padding,
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  }), [style, appearance.padding]);

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
    alignSelf: 'center',
  }), [checkColor]);

  const selectedCheckStyle = useMemo(() => ({
    ...checkStyle,
    backgroundColor: checkColor,
    border: `2px solid ${checkColor}`,
  }), [checkStyle, checkColor]);

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
    <div className="w-full flex flex-col" style={containerStyle}>
      {Array.isArray(items) && items.map((item) => {
        const isSelected = item.key === selectedProduct;
        
        return (
          <div
            key={item.key}
            className="flex items-start justify-between"
            style={isSelected ? selectedItemStyle : itemStyle}
            onClick={() => handleProductSelect(item.key)}
          >
            <div className="flex-1 flex flex-col gap-2">
              {/* Row 1: Icon and Title */}
              <div className="flex items-center gap-3">
                <IconRenderer 
                  icon={item.icon} 
                  style={iconStyle} 
                  defaultIcon={
                    <span className="text-gray-500" style={iconStyle}>●</span>
                  }
                />
                <span
                  style={{
                    color: titleFont?.color,
                    fontSize: titleFont?.size,
                    fontWeight: titleFont?.weight,
                    fontFamily: titleFont?.font,
                    lineHeight: titleFont?.lineHeight,
                    letterSpacing: titleFont?.letterSpacing,
                  }}
                >
                  {item.title}
                </span>
              </div>
              
              {/* Row 2: Description */}
              <div
                style={{
                  color: descriptionFont?.color,
                  fontSize: descriptionFont?.size,
                  fontWeight: descriptionFont?.weight,
                  fontFamily: descriptionFont?.font,
                  lineHeight: descriptionFont?.lineHeight,
                  letterSpacing: descriptionFont?.letterSpacing,
                  marginLeft: item.icon ? '0' : '0',
                }}
              >
                {item.description}
              </div>
            </div>
            
            {/* Check indicator */}
            <div style={isSelected ? selectedCheckStyle : checkStyle}>
              {isSelected && (
                <Check size={16} color="white" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VerticalProductsComponent; 