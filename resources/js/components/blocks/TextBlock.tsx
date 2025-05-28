import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance, BorderValue, FontValue, Style } from "@/contexts/Numi";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { MarkdownText } from "../ui/markdown-text";
import { resolveThemeValue } from "@/lib/theme";


// Block Components
function TextBlockComponent({ context }: { context: BlockContextType }) {

  const [text, setText, format] = Numi.useStateString({
    label: 'Text',
    name: 'value',
    defaultValue: 'Default Text!',
    inspector: 'multiline',
    format: 'markdown',
  });

  const theme = Numi.useTheme();

  const isMarkdown = format === 'markdown';

  const appearance = Numi.useAppearance([
    // Appearance.padding('padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {}, 'left'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),
    Style.font('font', 'Text Font & Color',
      {
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        },
      },
      {},
    ),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '0px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#000000'),
    Style.shadow('shadow', 'Shadow', {}, '0px 0px 0px 0px #000000'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);
  

  const font = style?.font as FontValue;
  const border = style?.border as BorderValue;
  const borderRadius = style?.borderRadius;
  const shadow = style?.shadow as string;

  const textStyles = useMemo(() => ({
    backgroundColor: style.backgroundColor,
    color: font?.color,
    fontFamily: font?.font,
    fontWeight: font?.weight,
    fontSize: font?.size,

    lineHeight: font?.lineHeight,

    letterSpacing: font?.letterSpacing,
    borderColor: style.borderColor,
    borderWidth: border?.width,
    borderStyle: border?.style,
    borderRadius : borderRadius ?? '3px',
    boxShadow: shadow,
    // padding: resolveThemeValue(appearance.padding, theme, 'padding'),
    margin: resolveThemeValue(appearance.margin, theme, 'margin'),
    whiteSpace: 'pre-line',
  }), [style, font, border, borderRadius, shadow]);

  const textClasses = useMemo(() => cn("max-w-none whitespace-pre-line",{
    "text-start": style.alignment === 'left',
    "text-center": style.alignment === 'center',
    "text-end": style.alignment === 'right',
    "text-justify": style.alignment === 'expand',
  }), [style.alignment, isMarkdown]);

  const textProps = {
    className: textClasses,
    id: context.blockId,
    style: textStyles,
  }

  if (style.hidden) {
    return null;
  }

  return (
    isMarkdown ? (
      <MarkdownText theme={theme} text={text} {...textProps} />
    ) : (
      <div {...textProps} >{text}</div>
    )
  );
}

export default TextBlockComponent;
