import Numi, { Style, BlockContext, Appearance, FontValue, JSONSchemaValue } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContext, useEffect, useMemo, useRef, useCallback } from "react";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { resolveThemeValue } from "@/lib/theme";
import { addAlphaToColor } from "../ui/color-picker";
// Define interfaces for the item structure
interface ItemType {
  key: string;
  label?: string;
  value?: string;
}

function OptionSelectorComponent({ context }: { context: BlockContextType }) {

  const checkout = Numi.useCheckout({});
  const { updateSessionProperties } = checkout;
  const session = checkout?.session;
  const theme = Numi.useTheme();

  const defaultValue = [{
    key: 'primary',
    label: 'Primary',
  }, {
    key: 'secondary',
    label: 'Secondary',
  }];

  const blockContext = useContext(BlockContext);
  const options = (blockContext.blockConfig?.content?.items ?? defaultValue) as ItemType[];

  // Helper: simple template evaluator for strings like {{ checkout.items[0].renewal_interval }}
  const isTemplate = Numi.isTemplate;

  const initialSelected = useMemo(() => {
    return options[0]?.key ?? undefined;
  }, [options]);

  // removed noisy init debug

  // default value needs to come from somewhere else?
  // and hte "Values" of each of these need to probabl match product name, sometimes it will match price, or interval?

  const [selectedTab, setSelectedTab, updateSelectedTabHook] = Numi.useStateEnumeration({
    name: 'value',
    initialValue: initialSelected,
    options: Array.isArray(options) ? options?.filter((item) => item.key).map((item) => item.key) : [],
    inspector: 'select',
    label: 'Default (Selected Tab)',
    asState: true,
  });

  useEffect(() => {
    // Debug when user changes selection
    console.log('[OptionSelector:change]', { selectedTab });
  }, [selectedTab]);

  useEffect(() => {
    // Log when session line items change
    console.log('[OptionSelector:session]', {
      line_items: session?.line_items?.map(li => ({ id: li.id, product: li.product?.name, price_id: li.price?.id })) || [],
      total: session?.total
    });
  }, [session?.line_items, session?.total]);

  const [items] = Numi.useStateJsonSchema({
    name: 'items',
    label: 'Options',
    defaultValue,
    schema: ({
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { title: "Value", type: "string" },
          value: { title: "Value", type: "string" },
          children: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                label: { type: "string" },
                caption: { type: "string" },
                color: { type: "string" },
                prefixImage: { type: "string", format: "uri", description: "Image URL", meta: { editor: "file" } },
                prefixIcon: { type: "string", description: "Icon name", meta: { editor: "icon" } },
                prefixText: { type: "string" },
                tooltip: { type: "string" },
                disabled: { type: "string" },
                hidden: { type: "string" },
              },
              required: [],
            }
          }
        },
        required: ["key"],
      }
    } as unknown) as JSONSchemaValue
  });

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}, '0px'),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }, '0px'),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const fontConfig = {
    config: {
      hideVerticalAlignment: true,
      hideHorizontalAlignment: true,
    },
  };

  const defaultAlignmentArgs = {
    options: {
      start: 'start',
      center: 'center',
      end: 'end',
    },
  };

  const style = Numi.useStyle([
    Style.backgroundColor('backgroundColor', 'Background Color', {}, '#FFFFFF'),
    Style.backgroundColor('activeBackgroundColor', 'Selected Color', {}, ''),
    Style.alignment('activeTextAlignment', 'Selected Text Alignment', defaultAlignmentArgs, 'center'),
    Style.font('activeTextFont', 'Selected Text Font & Color', fontConfig, {}),
    Style.border('activeBorder', 'Selected Border', {}, { width: '2px', style: 'solid' }),
    Style.borderRadius('activeBorderRadius', 'Selected Radius', {}, theme?.border_radius),
    Style.borderColor('activeBorderColor', 'Selected Border Color', {}),
    Style.shadow('activeShadow', 'Selected Shadow', {}),

    Style.alignment('inactiveTextAlignment', 'Unselected Text Alignment', defaultAlignmentArgs, 'center'),
    Style.backgroundColor('inactiveBackgroundColor', 'Unselected Color', {}, ''),
    Style.font('inactiveTextFont', 'Unselected Text Font & Color', fontConfig, {
      ...theme?.body_typography
    }),
    Style.border('inactiveBorder', 'Unselected Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('inactiveBorderRadius', 'Unselected Radius', {}, theme?.border_radius),
    Style.borderColor('inactiveBorderColor', 'Unselected Border Color', {}),
    Style.shadow('inactiveShadow', 'Unselected Shadow', {}),

    Style.backgroundColor('badgeBackgroundColor', 'Badge Background Color', {}, theme?.highlight_color),
    Style.font('badgeTextFont', 'Badge Text Font', fontConfig, {
      size: '12px'
    }),
    Style.border('badgeBorder', 'Badge Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('badgeBorderRadius', 'Badge Radius', {}, '12px'),
    Style.borderColor('badgeBorderColor', 'Badge Border Color', {}, '#000000'),
    Style.shadow('badgeShadow', 'Badge Shadow', {}),

    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, theme?.border_radius),
    Style.borderColor('borderColor', 'Border Color', {}),
    Style.shadow('shadow', 'Shadow', {}, theme?.shadow),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const activeBackgroundColor = resolveThemeValue(style.activeBackgroundColor, theme, 'secondary_color') as string;
  const activeBackgroundColorWithAlpha = addAlphaToColor(activeBackgroundColor, 0.10);

  const activeTextFont = {
    ...resolveThemeValue(style.activeTextFont, theme, 'body_typography') as FontValue,
    color: resolveThemeValue(style.activeTextFont?.color, theme, 'secondary_color') as string,
  };

  const inactiveTextFont = {
    ...resolveThemeValue(style.inactiveTextFont, theme, 'body_typography') as FontValue,
    color: resolveThemeValue(style.inactiveTextFont?.color, theme),
  };

  const badgeBackgroundColor = resolveThemeValue(style.badgeBackgroundColor, theme, 'secondary_color') as string;
  const badgeTextFont = {
    ...resolveThemeValue(style.badgeTextFont, theme, 'body_typography') as FontValue,
    color: resolveThemeValue(style.badgeTextFont?.color, theme, 'secondary_color') as string,
  };

  const containerStyle = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.backgroundColor, theme) as string | undefined,
    borderColor: resolveThemeValue(style.borderColor, theme) as string | undefined,
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius,
    boxShadow: style.shadow,
    padding: (appearance.padding as unknown as string | number | undefined),
    margin: (appearance.margin as unknown as string | number | undefined),
    gap: (appearance.spacing as unknown as string | number | undefined),
  }), [style, appearance, theme]);

  const activeTabStyle = useMemo(() => ({
    justifyContent: style.activeTextAlignment,
    backgroundColor:  style?.activeBackgroundColor ? (resolveThemeValue(style?.activeBackgroundColor, theme) as string | undefined) : activeBackgroundColorWithAlpha,
    color: activeTextFont?.color as string | undefined,
    fontSize: activeTextFont?.size,
    fontWeight: activeTextFont?.weight,
    fontFamily: activeTextFont?.font,
    lineHeight: activeTextFont?.lineHeight,
    letterSpacing: activeTextFont?.letterSpacing,
    borderColor: style?.activeBorderColor ? (resolveThemeValue(style?.activeBorderColor, theme) as string | undefined) : activeBackgroundColor,
    borderWidth: style.activeBorder?.width,
    borderStyle: style.activeBorder?.style,
    borderRadius: style.activeBorderRadius,
    boxShadow: style.activeShadow,
  }), [style, activeTextFont, theme, activeBackgroundColorWithAlpha, activeBackgroundColor]);

  const inactiveTabStyle = useMemo(() => ({
    justifyContent: style.inactiveTextAlignment,
    backgroundColor: resolveThemeValue(style?.inactiveBackgroundColor, theme) as string | undefined,
    color: inactiveTextFont?.color as string | undefined,
    fontSize: inactiveTextFont?.size,
    fontWeight: inactiveTextFont?.weight,
    fontFamily: inactiveTextFont?.font,
    lineHeight: inactiveTextFont?.lineHeight,
    letterSpacing: inactiveTextFont?.letterSpacing,
    borderColor: resolveThemeValue(style?.inactiveBorderColor, theme) as string | undefined,
    borderWidth: style.inactiveBorder?.width,
    borderStyle: style.inactiveBorder?.style,
    borderRadius: style.inactiveBorderRadius,
    boxShadow: style.inactiveShadow,
  }), [style, inactiveTextFont, theme]);

  const badgeStyle = useMemo(() => ({
    backgroundColor: badgeBackgroundColor,
    color: badgeTextFont?.color,
    fontSize: badgeTextFont?.size,
    fontWeight: badgeTextFont?.weight,
    fontFamily: badgeTextFont?.font,
    lineHeight: badgeTextFont?.lineHeight,
    letterSpacing: badgeTextFont?.letterSpacing,
    borderColor: resolveThemeValue(style.badgeBorderColor, theme) as string | undefined,
    borderWidth: style.badgeBorder?.width,
    borderStyle: style.badgeBorder?.style,
    borderRadius: style.badgeBorderRadius,
    boxShadow: style.badgeShadow,
  }), [style, badgeTextFont, badgeBackgroundColor, theme]);


  const interactionElements = useMemo(() => {
    return Array.isArray(items)
      ? items
          .filter(item => item.key)
          .map(item => ({ value: item.key, label: item.label }))
      : [];
  }, [items]);

  const { executeCallbacks, updateHook: updateEventCallbackHook } = Numi.useEventCallback({
    name: 'onClick',
    elements: interactionElements,
    events: [{
      label: EVENT_LABEL_MAP[Event.onClick],
      events: [Event.onClick],
    }]
  });

  // Compute resolved selection if the configured value is a template string
  const resolvedSelectedTab = Numi.useEvaluatedTemplate(selectedTab);

  // Ensure the value passed to Tabs is one of the option keys
  const tabValue = useMemo(() => {
    const keys = Array.isArray(options) ? options.map(o => o.key) : [];
    if (resolvedSelectedTab && keys.includes(resolvedSelectedTab)) return resolvedSelectedTab;
    return options[0]?.key;
  }, [resolvedSelectedTab, options]);

  const handleTabChange = useCallback((value: string) => {
    if (value === tabValue) {
      console.log('[OptionSelector] Ignoring click on already-selected tab:', value);
      return;
    }
    setSelectedTab(value);
    executeCallbacks(Event.onClick, value);
    updateSessionProperties(context.blockId, value);
  }, [executeCallbacks, updateSessionProperties, context.blockId, setSelectedTab, tabValue]);

  // If the stored value is a template, sync the evaluated value to session properties once
  const appliedTemplateDefaultRef = useRef(false);
  useEffect(() => {
    if (appliedTemplateDefaultRef.current) return;
    if (!isTemplate(selectedTab)) return;
    if (!tabValue) return;
    appliedTemplateDefaultRef.current = true;
    updateSessionProperties(context.blockId, tabValue);
  }, [selectedTab, tabValue, updateSessionProperties, context.blockId, isTemplate]);

  // useEffect(() => {
  //   executeCallbacks(Event.onClick, selectedTab);
  // }, []);

  const prevItemsRef = useRef(items);

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;

    const prevItems = prevItemsRef.current;
    // Only update if the items have actually changed
    if (JSON.stringify(items) !== JSON.stringify(prevItems)) {
      updateSelectedTabHook({ options: items });
      updateEventCallbackHook({ options: interactionElements });

      prevItemsRef.current = items;
    }
  }, [items, updateSelectedTabHook, interactionElements, updateEventCallbackHook]);

  return (
    <>
      <Tabs
        value={tabValue}
        onValueChange={handleTabChange}
        className="w-full flex"
      >
        <TabsList className="h-auto p-0 w-full" style={containerStyle}>
          {Array.isArray(items) && items.map((item) => (
            <TabsTrigger
              key={item.key}
              value={item.key}
              className="w-full h-10 flex flex-row gap-2"
              style={item.key === tabValue ? activeTabStyle : inactiveTabStyle}
            >
              {item.label}
              {item.badge && <div className='px-3 py-1' style={badgeStyle}>{item.badge}</div>}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </>
  );
}

export default OptionSelectorComponent;
