import { BlockContextType } from "@/types/blocks";
import ReactMarkdown from 'react-markdown';
import Numi, { Appearance, BorderValue, FontValue, Style } from "@/contexts/Numi";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import rehypeRaw from "rehype-raw";


// Block Components
function TextBlockComponent({ context }: { context: BlockContextType }) {
  const [text, setText, format] = Numi.useStateString({
    label: 'Text',
    name: 'value',
    defaultValue: 'Default Text!',
    inspector: 'multiline',
    format: 'markdown',
  });

  const isMarkdown = format === 'markdown';

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  
  const style = Numi.useStyle([
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

  const font = style?.font as FontValue;
  const border = style?.border as BorderValue;
  const borderRadius = style?.borderRadius;
  const shadow = style?.shadow as string;

  const padding = appearance.padding;

  const textStyles = useMemo(() => ({
    backgroundColor: style.backgroundColor || 'transparent',
    color: `${style.textColor || 'black'}`,
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
    padding,
  }), [style, font, border, borderRadius, shadow, padding]);

  const buttonClasses = useMemo(() => cn("max-w-none whitespace-pre-line",{
    "text-start": style.alignment === 'left',
    "text-center": style.alignment === 'center',
    "text-end": style.alignment === 'right',
    "text-justify": style.alignment === 'expand',
  }), [style.alignment, isMarkdown]);

  if (style.hidden) {
    return null;
  }

  function preserveAllLineBreaks(text: string): string {
    return text.replace(/\n/g, '<br/>');
  }


  return (
    <div
      className={buttonClasses}
      id={context.blockId}
      style={textStyles}
    >
      {isMarkdown ? (
        <ReactMarkdown
          rehypePlugins={[rehypeRaw]}
        >
          {preserveAllLineBreaks(text)}
        </ReactMarkdown>
      ) : (
        text
      )}
    </div>
  );
}

export default TextBlockComponent;