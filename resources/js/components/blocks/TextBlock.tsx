import { BlockContextType } from "@/types/blocks";
import ReactMarkdown from 'react-markdown';
import Numi, { BorderValue, FontValue, Style } from "@/contexts/Numi";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { cx } from "class-variance-authority";


// Block Components
function TextBlockComponent({ context }: { context: BlockContextType }) {
  const [text, setText, format] = Numi.useStateString({
    name: 'value',
    defaultValue: 'Default Text!',
    inspector: 'multiline',
    format: 'markdown',
  });

  const isMarkdown = format === 'markdown';

  const appearance = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {}, 'left'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, '#FFFFFF'),
    Style.textColor('textColor', 'Text Color', {}, '#000000'),
    Style.font(
      'font',
      'Text Font',
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
    Style.borderRadius('borderRadius', 'Border Radius', {}, '5px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#000000'),
    Style.shadow('shadow', 'Shadow', {}, '0px 0px 0px 0px #000000'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const font = appearance?.font as FontValue;
  const border = appearance?.border as BorderValue;
  const borderRadius = appearance?.borderRadius;
  const shadow = appearance?.shadow as string;

  const textStyles = useMemo(() => ({
    backgroundColor: appearance.backgroundColor || 'transparent',
    color: `${appearance.textColor || 'black'}`,
    fontFamily: font?.font,
    fontWeight: font?.weight,
    fontSize: font?.size,
    lineHeight: font?.lineHeight,
    letterSpacing: font?.letterSpacing,
    borderColor: appearance.borderColor,
    borderWidth: border?.width,
    borderStyle: border?.style,
    borderRadius : borderRadius ?? '3px',
    boxShadow: shadow,
  }), [appearance, font, border, borderRadius, shadow]);

  const buttonClasses = useMemo(() => cn("max-w-none p-2",{
    "text-start": appearance.alignment === 'left',
    "text-center": appearance.alignment === 'center',
    "text-end": appearance.alignment === 'right',
    "text-justify": appearance.alignment === 'expand',
  }), [appearance.alignment, isMarkdown]);

  if (appearance.hidden) {
    return null;
  }

  return (
    <div
      className={buttonClasses}
      id={context.blockId}
      style={textStyles}
    >
      {isMarkdown ? (
        <ReactMarkdown>{text}</ReactMarkdown>
      ) : (
        text
      )}
    </div>
  );
}

export default TextBlockComponent;