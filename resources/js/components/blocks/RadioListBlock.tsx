import Numi, { Style, BlockContext, Appearance, FontValue } from "@/contexts/Numi";
import { useContext, useEffect, useMemo, useRef, useCallback } from "react";
import { get } from "lodash";
import { useEditor } from "@/contexts/offer/editor-context";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { useDebounce } from "@/hooks/use-debounce";
import { resolveThemeValue } from "@/lib/theme";
// Define interfaces for the item structure
interface ItemType {
  key: string;
  label?: string;
}

function RadioListBlock() {

  const { updateSessionProperties } = Numi.useCheckout({});
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
          caption: {
            title: "Caption",
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
    Style.font('inactiveTextFont', 'Unselected Text Font & Color', fontConfig, { color: '#000000' }),
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
    // backgroundColor: resolveThemeValue(style.backgroundColor, theme),
    borderColor: resolveThemeValue(style.borderColor, theme),
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius,
    boxShadow: style.shadow,
    padding: appearance.padding,
    margin: appearance.margin,
    gap: appearance.spacing,
  }), [style, appearance]);

  const activeTabStyle = useMemo(() => ({
    justifyContent: style.activeTextAlignment,
    // Only keep selection indication styles here (background, border, etc.)
    // backgroundColor, borderColor, borderWidth, borderRadius, boxShadow, etc. can be added if needed
  }), [style]);

  const inactiveTabStyle = useMemo(() => ({
    justifyContent: style.inactiveTextAlignment,
    // Only keep unselected indication styles here
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    borderWidth: 0,
  }), [style]);

  const badgeStyle = useMemo(() => ({
    backgroundColor: badgeBackgroundColor,
    color: badgeTextFont?.color,
    fontSize: badgeTextFont?.size,
    fontWeight: badgeTextFont?.weight,
    fontFamily: badgeTextFont?.font,
    lineHeight: badgeTextFont?.lineHeight,
    letterSpacing: badgeTextFont?.letterSpacing,
    borderColor: resolveThemeValue(style.badgeBorderColor, theme),
    borderWidth: style.badgeBorder?.width,
    borderStyle: style.badgeBorder?.style,
    borderRadius: style.badgeBorderRadius,
    boxShadow: style.badgeShadow,
  }), [style, badgeTextFont, badgeBackgroundColor]);


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
    updateSessionProperties(blockContext.blockId, value);
  }, [executeCallbacks, updateSessionProperties, blockContext.blockId]);

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
    <div className="w-full flex flex-col" style={containerStyle as React.CSSProperties}>
      {Array.isArray(items) && items.map((item) => (
        <div key={item.key}>
          <label
            className={
              `flex w-full cursor-pointer rounded-md transition-colors mb-2`
            }
            style={
              (item.key === selectedTab
                ? activeTabStyle
                : inactiveTabStyle) as React.CSSProperties
            }
          >
            <input
              type="radio"
              name="radio-list-block"
              value={item.key}
              checked={selectedTab === item.key}
              onChange={() => handleTabChange(item.key)}
              className="form-radio h-5 w-5 text-secondary border-gray-300 focus:ring-secondary mt-0.5 mr-2"
            />
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center min-w-0">
                <span
                  className="text-left truncate"
                  style={
                    (item.key === selectedTab
                      ? {
                          color: activeTextFont?.color,
                          fontSize: activeTextFont?.size,
                          fontWeight: activeTextFont?.weight,
                          fontFamily: activeTextFont?.font,
                          lineHeight: activeTextFont?.lineHeight,
                          letterSpacing: activeTextFont?.letterSpacing,
                        }
                      : {
                          color: inactiveTextFont?.color,
                          fontSize: inactiveTextFont?.size,
                          fontWeight: inactiveTextFont?.weight,
                          fontFamily: inactiveTextFont?.font,
                          lineHeight: inactiveTextFont?.lineHeight,
                          letterSpacing: inactiveTextFont?.letterSpacing,
                        }
                    ) as React.CSSProperties
                  }
                >
                  {item.label}
                </span>
                {item.badge && (
                  <span className="ml-2 px-3 py-1 rounded-full text-xs font-medium" style={badgeStyle as React.CSSProperties}>
                    {item.badge}
                  </span>
                )}
              </div>
              {item.caption && (
                <div
                  className="text-sm text-gray-500 mt-0.5 text-left truncate"
                  style={
                    (item.key === selectedTab
                      ? {
                          color: activeTextFont?.color,
                          fontSize: activeTextFont?.size,
                          fontWeight: activeTextFont?.weight,
                          fontFamily: activeTextFont?.font,
                          lineHeight: activeTextFont?.lineHeight,
                          letterSpacing: activeTextFont?.letterSpacing,
                        }
                      : {
                          color: inactiveTextFont?.color,
                          fontSize: inactiveTextFont?.size,
                          fontWeight: inactiveTextFont?.weight,
                          fontFamily: inactiveTextFont?.font,
                          lineHeight: inactiveTextFont?.lineHeight,
                          letterSpacing: inactiveTextFont?.letterSpacing,
                        }
                    ) as React.CSSProperties
                  }
                >
                  {item.caption}
                </div>
              )}
            </div>
          </label>
        </div>
      ))}
    </div>
  );
}

export default RadioListBlock;
