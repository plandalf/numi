import React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import { Theme } from '@/types/theme';
import { FontValue } from '@/contexts/Numi';

interface MarkdownTextProps {
  text: string;
  style?: React.CSSProperties;
  className?: string;
  theme?: Theme;
  listItemGap?: string;
}

const getTypographyStyleInline = ({
  element,
  theme,
  style,
}: {
  element?: string;
  theme?: Theme;
  style?: React.CSSProperties;
}): React.CSSProperties => {
  const typography = theme?.[`${element}_typography` as keyof Theme] as FontValue;
  const { size, font, weight, color, letterSpacing, lineHeight } = typography || ({} as Partial<FontValue>);

  const inline: React.CSSProperties = {
    ...(color ? { color: color as React.CSSProperties['color'] } : {}),
    ...(size ? { fontSize: size as React.CSSProperties['fontSize'] } : {}),
    ...(font ? { fontFamily: font as React.CSSProperties['fontFamily'] } : {}),
    ...(weight ? { fontWeight: weight as React.CSSProperties['fontWeight'] } : {}),
    ...(lineHeight ? { lineHeight: lineHeight as React.CSSProperties['lineHeight'] } : {}),
    ...(letterSpacing ? { letterSpacing: letterSpacing as React.CSSProperties['letterSpacing'] } : {}),
  };

  return { ...inline, ...style };
};

const componentsForTheme = (
  theme?: Theme,
  baseStyle?: React.CSSProperties,
  listItemGap?: string
): Components => ({
  h1: (props) => <h1 {...props} style={{ ...getTypographyStyleInline({ theme, element: 'h1', style: baseStyle }), ...(props.style || {}) }} />,
  h2: (props) => <h2 {...props} style={{ ...getTypographyStyleInline({ theme, element: 'h2', style: baseStyle }), ...(props.style || {}) }} />,
  h3: (props) => <h3 {...props} style={{ ...getTypographyStyleInline({ theme, element: 'h3', style: baseStyle }), ...(props.style || {}) }} />,
  h4: (props) => <h4 {...props} style={{ ...getTypographyStyleInline({ theme, element: 'h4', style: baseStyle }), ...(props.style || {}) }} />,
  h5: (props) => <h5 {...props} style={{ ...getTypographyStyleInline({ theme, element: 'h5', style: baseStyle }), ...(props.style || {}) }} />,
  p: (props) => <p {...props} style={{ ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }), ...(props.style || {}) }} />,
  blockquote: (props) => <blockquote {...props} style={{ ...getTypographyStyleInline({ theme, element: 'label', style: baseStyle }), ...(props.style || {}) }} />,
  a: (props) => <a {...props} style={{ textDecoration: 'underline', ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }), ...(props.style || {}) }} />,
  code: (props) => <code {...props} style={{ ...getTypographyStyleInline({ theme, element: 'body', style: { ...(baseStyle || {}), fontFamily: (theme as any)?.mono_font } }), ...(props.style || {}) }} />,
  pre: (props) => <pre {...props} style={{ ...getTypographyStyleInline({ theme, element: 'body', style: { ...(baseStyle || {}), fontFamily: (theme as any)?.mono_font } }), ...(props.style || {}) }} />,

  // NEW ul/ol styles preserved from main, implemented inline for SSR
  ul: ({ children, ...props }) => (
    <ul
      {...props}
      style={{
        listStyleType: 'disc',
        marginLeft: 16,
        marginBlockStart: 0,
        marginBlockEnd: 0,
        ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }),
        ...(props.style || {}),
      }}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol
      {...props}
      style={{
        listStyleType: 'decimal',
        marginLeft: 16,
        marginTop: 0,
        marginBottom: 0,
        ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }),
        ...(props.style || {}),
      }}
    >
      {children}
    </ol>
  ),
  li: (props) => (
    <li
      {...props}
      style={{
        marginBottom: listItemGap ?? '0',
        ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }),
        ...(props.style || {}),
      }}
    />
  ),
});

const preserveAllLineBreaks = (text: string) => {
  return (text || '')
    .split('\n')
    .map((line) => (line.trim() === '' ? '&nbsp;' : line))
    .join('\n');
};

export const MarkdownText = ({ text, theme, style, className, listItemGap, ...props }: MarkdownTextProps) => {
  return (
    <div className={cn('numi-markdown whitespace-pre-line', className)} {...props}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          ...componentsForTheme(theme, style, listItemGap),
          h6: ({ children }) => <p style={getTypographyStyleInline({ theme, element: 'body', style })}>{children}</p>,
        }}
      >
        {preserveAllLineBreaks(text ?? '')}
      </ReactMarkdown>
    </div>
  );
};
