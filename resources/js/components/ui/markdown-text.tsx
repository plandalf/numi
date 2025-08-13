import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import { Theme } from '@/types/theme';
import styled from 'styled-components';
import { FontValue } from '@/contexts/Numi';

interface MarkdownTextProps {
  text: string;
  style?: React.CSSProperties;
  className?: string;
  theme?: Theme;
  listItemGap?: string;
}

const getTypographyStyle = ({
  element,
  theme,
  style,
} : {
  element?: string,
  theme?: Theme,
  style?: React.CSSProperties,
}) => {
  const typography = theme?.[`${element}_typography` as keyof Theme] as FontValue;
  const { size, font, weight, color, letterSpacing, lineHeight } = typography || {};

  const formatStyle = {
    color: style?.color ?? color,
    fontSize: style?.fontSize ?? size,
    fontFamily: style?.fontFamily ?? font,
    fontWeight: style?.fontWeight ?? weight,
    lineHeight: style?.lineHeight ?? lineHeight,
    letterSpacing: style?.letterSpacing ?? letterSpacing,
    textDecoration: style?.textDecoration,
  }

  return {
    ...(formatStyle?.color) && {'color':  formatStyle?.color },
    ...(formatStyle?.fontSize) && {'font-size':  formatStyle?.fontSize },
    ...(formatStyle?.fontFamily) && { 'font-family': formatStyle?.fontFamily },
    ...(formatStyle?.fontWeight) && { 'font-weight': formatStyle?.fontWeight },
    ...(formatStyle?.textDecoration) && { 'text-decoration': formatStyle?.textDecoration },
    ...(formatStyle?.lineHeight) && { 'line-height': formatStyle?.lineHeight },
    ...(formatStyle?.letterSpacing) && { 'letter-spacing': formatStyle?.letterSpacing },
  };
};

const Container = styled.div<{
  theme: Theme;
  style?: React.CSSProperties;
  listItemGap?: string;
}>`
  line-height: 0;
  ${({ theme, style }) => `
    h1 { ${Object.entries(getTypographyStyle({ theme, element: 'h1', style })).map(([k, v]) => `${k}: ${v}`).join(';')} }
    h2 { ${Object.entries(getTypographyStyle({ theme, element: 'h2', style })).map(([k, v]) => `${k}: ${v}`).join(';')} }
    h3 { ${Object.entries(getTypographyStyle({ theme, element: 'h3', style })).map(([k, v]) => `${k}: ${v}`).join(';')} }
    h4 { ${Object.entries(getTypographyStyle({ theme, element: 'h4', style })).map(([k, v]) => `${k}: ${v}`).join(';')} }
    h5 { ${Object.entries(getTypographyStyle({ theme, element: 'h5', style })).map(([k, v]) => `${k}: ${v}`).join(';')} }
    blockquote > p{ ${Object.entries(getTypographyStyle({ theme, element: 'label', style })).map(([k, v]) => `${k}: ${v}`).join(';')} }
    p { ${Object.entries(getTypographyStyle({ theme, element: 'body', style })).map(([k, v]) => `${k}: ${v}`).join(';')} }
    a { text-decoration: underline; }
    code { ${Object.entries(getTypographyStyle({ theme, element: 'body', style: {...style, fontFamily: theme?.mono_font} })).map(([k, v]) => `${k}: ${v}`).join(';')} }
    pre { ${Object.entries(getTypographyStyle({ theme, element: 'body', style: {...style, fontFamily: theme?.mono_font} })).map(([k, v]) => `${k}: ${v}`).join(';')} }
    ul,ol > li { ${Object.entries(getTypographyStyle({ theme, element: 'body', style })).map(([k, v]) => `${k}: ${v}`).join(';')} }
    ul { list-style-type: disc; margin-left: 16px; margin-block-start: 0; margin-block-end: 0; }
    ol { list-style-type: decimal; margin-left: 16px; margin-top: 0; margin-bottom: 0; }
  `}
  ${({ listItemGap }) => `
    ul li, ol li { margin-bottom: ${listItemGap ?? '0'}; }
    ul li:last-child, ol li:last-child { margin-bottom: 0; }
  `}
`;

const preserveAllLineBreaks = (text: string) => {
  return (text || '').split('\n').map(line => {
    // If line is empty, return a non-breaking space
    return line.trim() === '' ? '&nbsp;' : line;
  }).join('\n');
};

export const MarkdownText = ({ text, theme, style, className, listItemGap, ...props }: MarkdownTextProps) => {
  return (
    <Container
      theme={theme}
      style={style}
      listItemGap={listItemGap}
      className={cn("numi-markdown whitespace-pre-lineX", className)}
      {...props}
    >
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          h6: ({ children }) => (
            <p>{children}</p>
          ),
        }}
      >
        {preserveAllLineBreaks(text ?? '')}
      </ReactMarkdown>
    </Container>
  );
}

