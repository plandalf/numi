import Numi, { Appearance, Style } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import cx from "classnames";
import { useMemo } from "react";

function DetailListBlockComponent({ context }: { context: BlockContextType }) {

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
            type: "string"
          },
          caption: {
            title: "Caption",
            type: "string"
          },
          prefixImage: {
            title: "Image",
            type: "string",
            format: "uri",
            description: "A file upload input for selecting an image.",
            meta: { editor: "fileUpload" }
          },
          prefixIcon: {
            title: "Icon",
            type: "string",
            description: "Select an icon from a predefined list.",
            meta: { editor: "iconSelector" }
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
    }, 'left'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, '#FFFFFF'),
    Style.textColor('labelColor', 'Label Color', {}, '#000000'),
    Style.font('labelFont', 'Label Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '500',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('captionColor', 'Caption Color', {}, '#6a7282'),
    Style.font('captionFont', 'Caption Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('iconColor', 'Icon Color', {}, '#6a7282'),
    Style.dimensions('iconSize', 'Icon Size', {}, { width: '15px', height: '15px' }),
    Style.border('border', 'Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '5px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#000000'),
    Style.shadow('shadow', 'Button Shadow', {}, '0px 0px 0px 0px #000000'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);
  
  const containerStyles = useMemo(() => ({
    backgroundColor: style.backgroundColor || 'transparent',
    color: style.textColor || 'black',
    borderColor: style.borderColor,
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius ?? '3px',
    boxShadow: style.shadow,
    padding: appearance?.padding,
    margin: appearance?.margin,
    gap: appearance?.spacing,
  }), [style, appearance]);

  const innerContainerStyle = useMemo(() => ({
    alignItems: style.textAlignment,
    gap: appearance?.spacing,
  }), [style,appearance]);

  const labelStyle = useMemo(() => ({
    color: style.labelColor,
    fontSize: style.labelFont?.size,
    fontWeight: style.labelFont?.weight,
    fontFamily: style.labelFont?.font,
    lineHeight: style.labelFont?.lineHeight,
    letterSpacing: style.labelFont?.letterSpacing,
  }), [style]);

  const captionStyle = useMemo(() => ({
    color: style.captionColor,
    fontSize: style.captionFont?.size,
    fontWeight: style.captionFont?.weight,
    fontFamily: style.captionFont?.font,
    lineHeight: style.captionFont?.lineHeight,
    letterSpacing: style.captionFont?.letterSpacing,
  }), [style]);

  const tooltipIconStyle = useMemo(() => ({
    color: style.captionColor,
  }), [style]);

  const iconStyle = useMemo(() => ({
    color: style.iconColor,
    width: style.iconSize?.width,
    height: style.iconSize?.height,
  }), [style]);

  if(style.hidden) return null;

  const renderDetailItem = (item: any, depth = 0) => {
    if (!item || item.hidden) return null;

    // Don't render if item is disabled and we're showing only enabled items
    // This could be a filter toggle in the future

    return (
      <div>
        <div className="flex items-center space-x-2">
          {/* Prefix elements */}
          {item.prefixImage && (
            <img
              src={item.prefixImage}
              className="h-6 w-6 object-cover rounded"
              style={iconStyle}
            />
          )}

          {!item.prefixImage && item.prefixIcon && (
            <span className="text-gray-500" style={iconStyle}>
              {/* This would be a real icon component in production */}
              {item.prefixIcon === 'star' && '★'}
              {item.prefixIcon === 'heart' && '❤️'}
              {item.prefixIcon === 'circle' && '●'}
              {item.prefixIcon === 'square' && '■'}
              {item.prefixIcon === 'triangle' && '▲'}
            </span>
          )}

          {/* Main content */}
          <div className="flex-1">
            <div className="flex items-center">
              <span className="font-medium" style={labelStyle}>
                {item.label}
              </span>

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
              <div className="text-sm text-gray-500" style={captionStyle}>{item.caption}</div>
            )}
          </div>
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
