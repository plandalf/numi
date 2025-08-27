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

  const cleanedStyle = style
    ? (Object.fromEntries(Object.entries(style).filter(([, v]) => v !== undefined && v !== null)) as React.CSSProperties)
    : undefined;

  return cleanedStyle ? { ...inline, ...cleanedStyle } : inline;
};

const componentsForTheme = (
  theme?: Theme,
  baseStyle?: React.CSSProperties,
  listItemGap?: string
): Components => ({
  h1: ({ node: _node, style: s, ...rest }) => {
    void _node;
    return <h1 {...rest} style={{ ...getTypographyStyleInline({ theme, element: 'h1', style: baseStyle }), ...(s || {}), marginBlockStart: 0, marginBlockEnd: 0 }} />;
  },
  h2: ({ node: _node, style: s, ...rest }) => {
    void _node;
    return <h2 {...rest} style={{ ...getTypographyStyleInline({ theme, element: 'h2', style: baseStyle }), ...(s || {}), marginBlockStart: 0, marginBlockEnd: 0 }} />;
  },
  h3: ({ node: _node, style: s, ...rest }) => {
    void _node;
    return <h3 {...rest} style={{ ...getTypographyStyleInline({ theme, element: 'h3', style: baseStyle }), ...(s || {}), marginBlockStart: 0, marginBlockEnd: 0 }} />;
  },
  h4: ({ node: _node, style: s, ...rest }) => {
    void _node;
    return <h4 {...rest} style={{ ...getTypographyStyleInline({ theme, element: 'h4', style: baseStyle }), ...(s || {}), marginBlockStart: 0, marginBlockEnd: 0 }} />;
  },
  h5: ({ node: _node, style: s, ...rest }) => {
    void _node;
    return <h5 {...rest} style={{ ...getTypographyStyleInline({ theme, element: 'h5', style: baseStyle }), ...(s || {}), marginBlockStart: 0, marginBlockEnd: 0 }} />;
  },
  p: ({ node: _node, style: s, ...rest }) => {
    void _node;
    return <p {...rest} style={{ ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }), ...(s || {}), marginBlockStart: 0, marginBlockEnd: 0 }} />;
  },
  blockquote: ({ node: _node, style: s, ...rest }) => {
    void _node;
    return <blockquote {...rest} style={{ ...getTypographyStyleInline({ theme, element: 'label', style: baseStyle }), ...(s || {}), marginBlockStart: 0, marginBlockEnd: 0 }} />;
  },
  a: ({ node: _node, style: s, ...rest }) => {
    void _node;
    return <a {...rest} style={{ textDecoration: 'underline', ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }), ...(s || {}), marginBlockStart: 0, marginBlockEnd: 0 }} />;
  },
  code: ({ node: _node, style: s, ...rest }) => {
    void _node;
    return (
      <code
        {...rest}
        style={{
          ...getTypographyStyleInline({
            theme,
            element: 'body',
            style: { ...(baseStyle || {}), fontFamily: (theme as Theme & { mono_font?: string })?.mono_font },
          }),
          ...(s || {}),
          margin: 0,
        }}
      />
    );
  },
  pre: ({ node: _node, style: s, ...rest }) => {
    void _node;
    return (
      <pre
        {...rest}
        style={{
          ...getTypographyStyleInline({
            theme,
            element: 'body',
            style: { ...(baseStyle || {}), fontFamily: (theme as Theme & { mono_font?: string })?.mono_font },
          }),
          ...(s || {}),
          margin: 0,
        }}
      />
    );
  },

  // NEW ul/ol styles preserved from main, implemented inline for SSR
  ul: ({ node: _node, children, style: s, ...rest }) => {
    void _node;
    return (
      <ul
        {...rest}
        style={{
          ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }),
          ...(s || {}),
          listStyleType: 'disc',
          marginLeft: 16,
          marginBlockStart: 0,
          marginBlockEnd: 0,
          padding: 0,
        }}
      >
        {children}
      </ul>
    );
  },
  ol: ({ node: _node, children, style: s, ...rest }) => {
    void _node;
    return (
      <ol
        {...rest}
        style={{
          ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }),
          ...(s || {}),
          listStyleType: 'decimal',
          marginLeft: 16,
          marginTop: 0,
          marginBottom: 0,
          padding: 0,
        }}
      >
        {children}
      </ol>
    );
  },
  li: ({ node: _node, children, style: s, ...rest }) => {
    void _node;
    return (
      <li
        {...rest}
        style={{
          margin: 0,
          marginBottom: listItemGap ?? '0',
          ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }),
          ...(s || {}),
        }}
      >
        {children}
      </li>
    );
  },
});

const preserveAllLineBreaks = (text: string) => {
  return text ?? '';
};

export const MarkdownText = ({ text, theme, style, className, listItemGap, ...props }: MarkdownTextProps) => {
  return (
    <div className={cn('numi-markdown', className)} {...props}>
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
