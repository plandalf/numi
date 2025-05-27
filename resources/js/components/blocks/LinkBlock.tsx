import Numi, { Appearance, BorderValue, FontValue, IconValue, Style } from '@/contexts/Numi';
import cx from "classnames";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { IconRenderer } from "../ui/icon-renderer";

function LinkBlockComponent() {
  const [text] = Numi.useStateString({
    label: 'Text',
    name: 'value',
    defaultValue: 'Submit',
  });

  const [url] = Numi.useStateString({
    label: 'URL',
    name: 'url',
    defaultValue: 'https://www.google.com',
    config: {
      validations: ['url'],
    },
  });
  
  const [icon] = Numi.useStateJsonSchema({
    name: 'icon',
    label: 'Icon',
    defaultValue: { icon: null,  emoji: null, url: null } as IconValue,
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      meta: { editor: "iconSelector" },
    },
  });

  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {
      options: {
        left: 'Left',
        center: 'Center',
        right: 'Right',
      },
    }, 'left'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, '#FFFFFF'),
    
    Style.backgroundColor('iconColor', 'Icon Color', {}, '#000000'),
    Style.dimensions('iconSize', 'Icon Size', {
      config: {
        hideWidth: true
      }
    }, {height: '16px'}),
    
    Style.font('linkFont', 'Link Font & Color',
      {
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        },
      },
      {
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.border('border', 'Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Radius', {}, '5px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#000000'),
    Style.shadow('shadow', 'Shadow', {}, '0px 0px 0px 0px #000000'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const linkFont = style?.linkFont as FontValue;
  const border = style?.border as BorderValue;
  const borderRadius = style?.borderRadius;
  const shadow = style?.shadow as string;

  const linkStyles = useMemo(() => ({
    backgroundColor: style.backgroundColor,
    color: style.linkFont?.color,
    fontFamily: linkFont?.font,
    fontWeight: linkFont?.weight,
    fontSize: linkFont?.size,
    lineHeight: linkFont?.lineHeight,
    letterSpacing: linkFont?.letterSpacing,
    borderColor: style.borderColor,
    borderWidth: border?.width,
    borderStyle: border?.style,
    borderRadius : borderRadius ?? '3px',
    boxShadow: shadow,
    padding: appearance?.padding,
    gap: appearance?.spacing,
  }), [style, linkFont, border, borderRadius, shadow, appearance]);

  const linkClasses = useMemo(() => cx({
    'text-sm flex flex-row gap-x-4 items-center': true,
    "w-full": style.alignment === 'expand',
    "border-none": style.border === 'none',
    "border-[1px]": style.border === 'xs',
    "border-[4px]": style.border === 'sm',
    "border-[8px]": style.border === 'md',
    "border-[12px]": style.border === 'lg',
    "border-[16px]": style.border === 'xl',
  }), [style.alignment, style.fontWeight, style.border]);

  const containerClasses = useMemo(() => cn("space-y-2 flex", {
    "justify-start": style.alignment === 'left',
    "justify-center": style.alignment === 'center',
    "justify-end": style.alignment === 'right',
    "justify-stretch": style.alignment === 'expand',
  }), [style.alignment]);

  const containerStyles = useMemo(() => ({
    margin: appearance?.margin,
    textAlign: style.textAlignment,
  }), [appearance, style.textAlignment]);

  const iconStyles = useMemo(() => ({
    size: style?.iconSize?.height ?? '16px',
    color: style?.iconColor ?? 'black',
  }), [style]);

  if (style.hidden) {
    return null;
  }

  return (
    <div className={containerClasses} style={containerStyles}>
      <a
        href={url}
        className={linkClasses}
        style={linkStyles}
      >
        <IconRenderer icon={icon} style={iconStyles} defaultIcon={''}/>
        <span style={{ textDecoration: 'underline' }}>{text}</span>
      </a>
    </div>
  );
}

export default LinkBlockComponent;
