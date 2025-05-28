import Numi, { Appearance, BorderValue, FontValue, IconValue, Style } from '@/contexts/Numi';
import cx from "classnames";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { IconRenderer } from "../ui/icon-renderer";
import { resolveThemeValue } from '@/lib/theme';
import { MarkdownText } from '../ui/markdown-text';

function LinkBlockComponent() {
  const theme = Numi.useTheme();
  const [text] = Numi.useStateString({
    label: 'Text',
    name: 'value',
    defaultValue: 'Submit',
    meta: { editor: "markdown" },
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
      {},
    ),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
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
  const linkFont = resolveThemeValue(style.linkFont, theme, 'body_typography') as FontValue;
  const border = style?.border as BorderValue;
  const borderRadius = style?.borderRadius;
  const shadow = style?.shadow as string;

  console.log('linkFont', linkFont);
  console.log('style.linkFont', style.linkFont);

  const markdownStyles = useMemo(() => ({
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
    textDecoration: 'underline',
    padding: resolveThemeValue(appearance.padding, theme, 'padding'),
  }), [style, linkFont, border, borderRadius, shadow, appearance]);

  const linkStyles = useMemo(() => ({
    gap: resolveThemeValue(appearance.spacing, theme, 'spacing'),
  }), [appearance]);

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
    margin: resolveThemeValue(appearance.margin, theme, 'margin'),
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
        <MarkdownText text={text} theme={theme} style={markdownStyles} />
      </a>
    </div>
  );
}

export default LinkBlockComponent;
