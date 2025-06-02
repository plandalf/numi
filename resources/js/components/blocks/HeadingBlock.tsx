import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance, BorderValue, FontValue, Style } from "@/contexts/Numi";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { MarkdownText } from "../ui/markdown-text";
import { resolveThemeValue } from "@/lib/theme";


// Block Components
function HeadingBlockComponent({ context }: { context: BlockContextType }) {

  const [text, setText, format] = Numi.useStateString({
    label: 'Text',
    name: 'value',
    defaultValue: 'Default Text!',
    inspector: 'multiline',
  });

  const [headingLevel] = Numi.useStateEnumeration({
    name: 'headingLevel',
    initialValue: 'h1',
    options: ['h1', 'h2', 'h3', 'h4', 'h5'],
    labels: {
      h1: 'Heading 1',
      h2: 'Heading 2',
      h3: 'Heading 3',
      h4: 'Heading 4',
      h5: 'Heading 5',
    },
    inspector: 'select',
    label: 'Heading Level',
  });

  const theme = Numi.useTheme();

  const isMarkdown = format === 'markdown';

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}, '0px'),
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
    Style.borderRadius('borderRadius', 'Border Radius', {}, theme?.border_radius),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, ''),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const font = style?.font as FontValue;
  const border = style?.border as BorderValue;
  const borderRadius = style?.borderRadius;
  const shadow = style?.shadow as string;

  const textStyles = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.backgroundColor, theme),
    color: resolveThemeValue(font?.color, theme),
    fontFamily: font?.font,
    fontWeight: font?.weight,
    fontSize: font?.size,

    lineHeight: font?.lineHeight,

    letterSpacing: font?.letterSpacing,
    borderColor: resolveThemeValue(style.borderColor, theme),
    borderWidth: border?.width,
    borderStyle: border?.style,
    borderRadius : borderRadius ?? '3px',
    boxShadow: shadow,
    padding: appearance.padding,
    margin: appearance.margin,
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

  const textContent = useMemo(() => {
    switch (headingLevel) {
      case 'h1':
        return `# ${text}`;
      case 'h2':
        return `## ${text}`;
      case 'h3':
        return `### ${text}`;
      case 'h4':
        return `#### ${text}`;
      case 'h5':
        return `##### ${text}`;
    }
  }, [headingLevel, text]);

  return (<MarkdownText theme={theme} text={textContent} {...textProps} />);
}

export default HeadingBlockComponent;
