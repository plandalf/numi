import Numi, { Appearance, FontValue, IconValue, Style } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { useMemo } from "react";
import { IconRenderer } from "../ui/icon-renderer";
import { MarkdownText } from "../ui/markdown-text";
import { resolveThemeValue } from "@/lib/theme";

function DetailListBlockComponent({ context }: { context: BlockContextType }) {

  const theme = Numi.useTheme();

  const [items] = Numi.useStateJsonSchema({
    name: 'items',
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "array",
      items: {
        type: "object",
        properties: {
          key: {
            type: "string",
            meta: { editor: "hidden" }
          },
          children: {
            type: "array",
            items: {
              $ref: "#"
            }
          },
          label: {
            title: "Label",
            type: "string",
            meta: { editor: "markdown" },
          },
          caption: {
            title: "Caption",
            type: "string",
            meta: { editor: "markdown" },
          },
          icon: {
            title: 'Icon',
            type: "object",
            defaultValue: { icon: null,  emoji: null, url: null } as IconValue,
            meta: { editor: "iconSelector" },
          },
          tooltip: {
            title: "Tooltip",
            type: "string"
          },
          disabled: {
            title: "Disabled",
            type: "boolean"
          },
          hidden: {
            title: "Hidden",
            type: "boolean"
          }
        },
        required: ["key"]
      }
    },
    defaultValue: [{
      label: 'Item 1',
      caption: 'Item 1 caption',
      prefixIcon: 'circle'
    }],
  });

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
    }, 'start'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),
    Style.font('labelFont', 'Label Font & Color', fontConfig, {}),
    Style.font('captionFont', 'Caption Font & Color', fontConfig, {}),
    Style.alignment('iconAlignment', 'Icon Alignment', {
      options: {
        start: 'start',
        center: 'center',
        end: 'end',
      },
    }, 'start'),
    Style.textColor('iconColor', 'Icon Color', {}, theme?.primary_color),
    Style.dimensions('iconSize', 'Icon Size', {
      config: {
        hideWidth: true
      }
    }, { width: '15px', height: '15px' }),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '0px'),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Button Shadow', {}, ''),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const appearance = Numi.useAppearance([
    // Appearance.padding('padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.spacing('labelAndCaptionSpacing', 'Label & Caption Spacing', {}),
    Appearance.spacing('iconAndTextSpacing', 'Icon & Text Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const containerStyles = useMemo(() => ({
    backgroundColor: style.backgroundColor || 'transparent',
    color: style.textColor || 'black',
    borderColor: style.borderColor,
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius,
    boxShadow: style.shadow,
    // padding: resolveThemeValue(appearance.padding, theme, 'padding'),
    margin: resolveThemeValue(appearance.margin, theme, 'margin'),
    gap: resolveThemeValue(appearance.spacing, theme, 'spacing'),
  }), [style, appearance]);

  const innerContainerStyle = useMemo(() => ({
    alignItems: style.textAlignment,
    gap: resolveThemeValue(appearance.spacing, theme, 'spacing'),
  }), [style,appearance]);

  const labelFont = resolveThemeValue(style.labelFont, theme, 'h4_typography') as FontValue;
  const captionFont = resolveThemeValue(style.captionFont, theme, 'body_typography') as FontValue;

  const labelStyle = useMemo(() => ({
    color: labelFont?.color,
    fontSize: labelFont?.size,
    fontWeight: labelFont?.weight,
    fontFamily: labelFont?.font,
    lineHeight: labelFont?.lineHeight,
    letterSpacing: labelFont?.letterSpacing,
  }), [labelFont]);

  const captionStyle = useMemo(() => ({
    color: captionFont?.color,
    fontSize: captionFont?.size,
    fontWeight: captionFont?.weight,
    fontFamily: captionFont?.font,
    lineHeight: captionFont?.lineHeight,
    letterSpacing: captionFont?.letterSpacing,
  }), [captionFont]);

  const tooltipIconStyle = useMemo(() => ({
    color: captionFont?.color,
  }), [captionFont]);

  const iconStyle = useMemo(() => ({
    alignSelf: style.iconAlignment ?? 'start',
    color: resolveThemeValue(style.iconColor, theme, 'primary_color'),
    size: style.iconSize?.height ?? '15px',
  }), [style]);

  const textContainerStyle = useMemo(() => ({
    gap: resolveThemeValue(appearance.labelAndCaptionSpacing, theme, 'spacing') as string
  }), [appearance]);

  const containerStyle = useMemo(() => ({
    gap: resolveThemeValue(appearance.iconAndTextSpacing, theme, 'spacing') as string
  }), [appearance]);

  if(style.hidden) return null;

  const renderDetailItem = (item: any, depth = 0) => {
    if (!item || item.hidden) return null;

    // Don't render if item is disabled and we're showing only enabled items
    // This could be a filter toggle in the future

    return (
      <div 
        key={item.label}
        className="flex items-center"
        style={containerStyle}
      >
        <IconRenderer icon={item.icon} style={iconStyle} defaultIcon={
          <span className="text-gray-500" style={iconStyle}>●</span>
        }/>

        {/* Main content */}
        <div
          className="flex-1 flex flex-col"
          style={textContainerStyle}
        >
          <div className="flex items-center">
            <MarkdownText
              className="font-medium"
              text={item.label}
              style={labelStyle}
              theme={theme}
            />
            {item.tooltip && (
              <div
                className="ml-2 text-gray-500 cursor-help"
                style={tooltipIconStyle}
                title={item.tooltip}
              >
                ⓘ
              </div>
            )}
          </div>

          {item.caption && (
            <MarkdownText
              className="text-sm text-gray-500"
              text={item.caption}
              style={captionStyle}
              theme={theme}
            />
          )}
        </div>
      </div>
    );
  };

  const dataToRender = items && items.length > 0 ? items : [];

  return (
    <div style={containerStyles}>
      {dataToRender && dataToRender.length > 0 && (
        <div className="flex flex-col" style={innerContainerStyle}>
          {dataToRender.map((item: any) => renderDetailItem(item))}
        </div>
      )}

      {(!dataToRender || dataToRender.length === 0) && (
        <div className="text-xs text-gray-500 mt-2 p-1 bg-gray-50 rounded">
          Note: Showing sample data. Edit in the JSONSchema editor to customize.
        </div>
      )}
    </div>
  );
}

export default DetailListBlockComponent;
