import Numi, { Appearance, BorderValue, IconValue, Style } from '@/contexts/Numi';
import cx from "classnames";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { IconRenderer } from "../ui/icon-renderer";
import { resolveThemeValue } from '@/lib/theme';
import { MarkdownText } from '../ui/markdown-text';

function LinkBlockComponent() {
  const { isEditor } = Numi.useCheckout({});

  const theme = Numi.useTheme();
  const [text] = Numi.useStateString({
    label: 'Text',
    name: 'value',
    defaultValue: 'Submit',
    inspector: 'multiline',
    format: 'markdown',
  });

  const [linkStyle] = Numi.useStateEnumeration({
    name: 'style',
    initialValue: 'link',
    options: ['link', 'button'],
    labels: {
      link: 'Link',
      button: 'Button',
    } as Record<string, string>,
    inspector: 'select',
    label: 'Style',
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

  const [openBehavior] = Numi.useStateEnumeration({
    name: 'openBehavior',
    initialValue: 'same',
    options: ['same', 'new', 'popup'],
    labels: {
      same: 'Open in this window',
      new: 'Open in new tab',
      popup: 'Open in popup window',
    } as Record<string, string>,
    inspector: 'select',
    label: 'Open Behavior',
  });

  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {}, 'left'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),

    Style.backgroundColor('iconColor', 'Icon Color', {}, ''),
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
        ...(linkStyle === 'button' && {
          color: theme?.primary_contrast_color,
        }),
      },
    ),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Radius', {}, ''),
    Style.borderColor('borderColor', 'Border Color', {}, '#000000'),
    Style.shadow('shadow', 'Shadow', {}, '0px 0px 0px 0px #000000'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const linkFont = style.linkFont;

  const border = style?.border as BorderValue;
  const borderRadius = style?.borderRadius;
  const shadow = style?.shadow as string;

  const markdownStyles = useMemo(() => ({
    color: resolveThemeValue(
      style?.linkFont?.color,
      theme,
      linkStyle === 'button' ? 'primary_contrast_color' : undefined
    ) as string,
    fontFamily: linkFont?.font,
    fontWeight: linkFont?.weight,
    fontSize: linkFont?.size,
    lineHeight: linkFont?.lineHeight,
    letterSpacing: linkFont?.letterSpacing,
    ...(linkStyle === 'link' && {
      textDecoration: 'underline',
    }),
  }), [style, linkFont, border, borderRadius, shadow, appearance]);

  const linkStyles = useMemo(() => ({
    borderColor: resolveThemeValue(style.borderColor, theme) as string,
    borderWidth: border?.width,
    borderStyle: border?.style,
    borderRadius : borderRadius ?? '3px',
    boxShadow: shadow,
    backgroundColor: resolveThemeValue(
      style.backgroundColor,
      theme,
      linkStyle === 'button' ? 'primary_color' : undefined
    ) as string,
    padding: !appearance.padding && linkStyle === 'button' ? resolveThemeValue(appearance.padding, theme, 'padding') : appearance.padding,
    gap: appearance.spacing,
  }), [appearance]);

  const linkClasses = useMemo(() => cx({
    "flex flex-row gap-x-2 items-center text-center": true,
    "border border-gray-300 rounded-md": true,
    "hover:cursor-pointer hover:brightness-90 active:brightness-85": true,
    "w-full justify-center": style.alignment === 'expand',
    "w-fit": style.alignment !== 'expand',
    'text-sm flex flex-row gap-x-4 items-center': true,
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
    margin: appearance.margin,
    textAlign: style.textAlignment,
  }), [appearance, style.textAlignment]);

  const iconStyles = useMemo(() => ({
    size: style?.iconSize?.height ?? '16px',
    color: resolveThemeValue(
      style?.iconColor,
      theme,
      linkStyle === 'button' ? 'primary_contrast_color' : undefined
    ) as string,
  }), [style]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isEditor) {
      e.preventDefault();
      return;
    }

    if (openBehavior === 'popup') {
      e.preventDefault();
      window.open(
        url,
        '_blank',
        'width=800,height=600,scrollbars=yes,resizable=yes,toolbar=no,menubar=no,location=no'
      );
    }
  };

  const getTarget = () => {
    switch (openBehavior) {
      case 'new':
        return '_blank';
      case 'popup':
        return '_self'; // Handled by click event
      case 'same':
      default:
        return '_self';
    }
  };

  if (style.hidden) {
    return null;
  }

  return (
    <div className={containerClasses} style={containerStyles}>
      <a
        href={url}
        className={linkClasses}
        style={linkStyles}
        onClick={handleClick}
        target={getTarget()}
      >
        <IconRenderer icon={icon} style={iconStyles} defaultIcon={''}/>
        <MarkdownText text={text} theme={theme} style={markdownStyles} />
      </a>
    </div>
  );
}

export default LinkBlockComponent;
