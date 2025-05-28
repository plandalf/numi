import Numi, { Style, BlockContext, Appearance } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useContext, useEffect, useMemo, useRef, useCallback } from "react";
import { get } from "lodash";
import { useEditor } from "@/contexts/offer/editor-context";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { useDebounce } from "@/hooks/use-debounce";
import { useCheckoutState } from "@/pages/checkout-main";
import { resolveThemeValue } from "@/lib/theme";
// Define interfaces for the item structure
interface ItemType {
  key: string;
  label?: string;
}

function OptionSelectorComponent({ context }: { context: BlockContextType }) {

  const theme = Numi.useTheme();

  const defaultValue = [{
    key: 'primary',
    label: 'Primary',
  }, {
    key: 'secondary',
    label: 'Secondary',
  }];

  const blockContext = useContext(BlockContext);
  const options = get(blockContext.blockConfig, `content.items`, defaultValue) as ItemType[];

  const [selectedTab, setSelectedTab, updateSelectedTabHook] = Numi.useStateEnumeration({
    name: 'selectedTab',
    initialValue: options[0]?.key ?? undefined,
    options: Array.isArray(options) ? options?.filter((item) => item.key).map((item) => item.key) : [],
    inspector: 'select',
    label: 'Default (Selected Tab)',
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
          children: {
            type: "array",
            items: {
              type: "object"
            }
          },
          label: {
            title: "Label",
            type: "string"
          },
          badge: {
            title: "Badge",
            type: "string"
          }
        },
        required: ["key"]
      }
    }
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
    Style.alignment('textAlignment', 'Text Alignment', {
      options: {
        start: 'start',
        center: 'center',
        end: 'end',
      },
    }, 'center'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),
    Style.backgroundColor('activeBackgroundColor', 'Selected Color', {}, '#FFFFFF'),
    Style.font('activeTextFont', 'Selected Text Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.border('activeBorder', 'Selected Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('activeBorderRadius', 'Selected Radius', {}, '5px'),
    Style.borderColor('activeBorderColor', 'Selected Border Color', {}, '#000000'),
    Style.shadow('activeShadow', 'Selected Shadow', {}, '0px 0px 0px 0px #000000'),

    Style.backgroundColor('inactiveBackgroundColor', 'Unselected Color', {}, '#f5f5f5'),
    Style.font('inactiveTextFont', 'Unselected Text Font & Color',
      fontConfig,
      {
        color: '#848ec2',
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.border('inactiveBorder', 'Unselected Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('inactiveBorderRadius', 'Unselected Radius', {}, '5px'),
    Style.borderColor('inactiveBorderColor', 'Unselected Border Color', {}, '#000000'),
    Style.shadow('inactiveShadow', 'Unselected Shadow', {}, '0px 0px 0px 0px #000000'),

    Style.backgroundColor('badgeBackgroundColor', 'Badge Background Color', {}, '#f5f5f5'),
    Style.font('badgeTextFont', 'Badge Text Font',
      fontConfig,
      {
        color: '#848ec2',
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.border('badgeBorder', 'Badge Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('badgeBorderRadius', 'Badge Radius', {}, '5px'),
    Style.borderColor('badgeBorderColor', 'Badge Border Color', {}, '#000000'),
    Style.shadow('badgeShadow', 'Badge Shadow', {}, '0px 0px 0px 0px #000000'),

    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '0px'),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, ''),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const containerStyle = useMemo(() => ({
    backgroundColor: style.backgroundColor || 'transparent',
    borderColor: style.borderColor,
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius ?? '3px',
    boxShadow: style.shadow,
    padding: resolveThemeValue(appearance.padding, theme, 'padding'),
    margin: resolveThemeValue(appearance.margin, theme, 'margin'),
    gap: resolveThemeValue(appearance.spacing, theme, 'spacing'),
  }), [style, appearance]);

  const activeTabStyle = useMemo(() => ({
    justifyContent: style.textAlignment,
    backgroundColor: style.activeBackgroundColor || '#fbf9fa',
    color: style.activeTextFont?.color,
    fontSize: style.activeTextFont?.size,
    fontWeight: style.activeTextFont?.weight,
    fontFamily: style.activeTextFont?.font,
    lineHeight: style.activeTextFont?.lineHeight,
    letterSpacing: style.activeTextFont?.letterSpacing,
    borderColor: style.activeBorderColor,
    borderWidth: style.activeBorder?.width,
    borderStyle: style.activeBorder?.style,
    borderRadius: style.activeBorderRadius,
    boxShadow: style.activeShadow,
  }), [style]);

  const inactiveTabStyle = useMemo(() => ({
    justifyContent: style.textAlignment,
    backgroundColor: style.inactiveBackgroundColor || 'white',
    color: style.inactiveTextFont?.color,
    fontSize: style.inactiveTextFont?.size,
    fontWeight: style.inactiveTextFont?.weight,
    fontFamily: style.inactiveTextFont?.font,
    lineHeight: style.inactiveTextFont?.lineHeight,
    letterSpacing: style.inactiveTextFont?.letterSpacing,
    borderColor: style.inactiveBorderColor,
    borderWidth: style.inactiveBorder?.width,
    borderStyle: style.inactiveBorder?.style,
    borderRadius: style.inactiveBorderRadius,
    boxShadow: style.inactiveShadow,
  }), [style]);

  const badgeStyle = useMemo(() => ({
    backgroundColor: style.badgeBackgroundColor,
    color: style.badgeTextFont?.color,
    fontSize: style.badgeTextFont?.size,
    fontWeight: style.badgeTextFont?.weight,
    fontFamily: style.badgeTextFont?.font,
    lineHeight: style.badgeTextFont?.lineHeight,
    letterSpacing: style.badgeTextFont?.letterSpacing,
    borderColor: style.badgeBorderColor,
    borderWidth: style.badgeBorder?.width,
    borderStyle: style.badgeBorder?.style,
    borderRadius: style.badgeBorderRadius,
    boxShadow: style.badgeShadow,
  }), [style]);


  const interactionElements = useMemo(() => {
    return Array.isArray(items) ? items.filter(item => item.key).map(item => ({ value: item.key, label: item.label })) : [];
  }, [items]);

  const { executeCallbacks } = Numi.useEventCallback({
    name: 'onClick',
    elements: interactionElements,
    events: [{
      label: EVENT_LABEL_MAP[Event.onClick],
      events: [Event.onClick],
    }]
  });

  const handleTabChange = useCallback((value: string) => {
    setSelectedTab(value);
    executeCallbacks(Event.onClick, value);
  }, [executeCallbacks]);

  useEffect(() => {
    executeCallbacks(Event.onClick, selectedTab);
  }, []);

  const prevItemsRef = useRef(items);

  useEffect(() => {
    if (!Array.isArray(items) || items.length === 0) return;

    const itemKeys = items.filter(item => item.key).map(item => item.key);
    const prevItemKeys = prevItemsRef.current.filter(item => item.key).map(item => item.key);

    // Only update if the items have actually changed
    if (JSON.stringify(itemKeys) !== JSON.stringify(prevItemKeys)) {
      updateSelectedTabHook({ options: itemKeys });
      prevItemsRef.current = items;
    }
  }, [items, updateSelectedTabHook]);

  return (
    <Tabs
      defaultValue={selectedTab}
      onValueChange={handleTabChange}
      className="w-full"
    >
      <TabsList className="h-auto p-0 w-full" style={containerStyle}>
        {Array.isArray(items) && items.map((item) => (
          <TabsTrigger
            key={item.key}
            value={item.key}
            className="w-full h-10 flex flex-row gap-2"
            style={item.key === selectedTab ? activeTabStyle : inactiveTabStyle}
          >
            {item.label}
            {item.badge && <div className='shadow-sm bg-gray-200 rounded-full px-3 py-1' style={badgeStyle}>{item.badge}</div>}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export default OptionSelectorComponent;
