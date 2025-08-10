import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import { Theme } from '@/types/theme';
import { FontValue } from '@/contexts/Numi';

interface MarkdownTextProps {
  text: string;
  style?: React.CSSProperties;
  className?: string;
  theme?: Theme;
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

const componentsForTheme = (theme?: Theme, baseStyle?: React.CSSProperties) => ({
  h1: ({ children }: { children: React.ReactNode }) => (
    <h1 style={getTypographyStyleInline({ theme, element: 'h1', style: baseStyle })}>{children}</h1>
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 style={getTypographyStyleInline({ theme, element: 'h2', style: baseStyle })}>{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 style={getTypographyStyleInline({ theme, element: 'h3', style: baseStyle })}>{children}</h3>
  ),
  h4: ({ children }: { children: React.ReactNode }) => (
    <h4 style={getTypographyStyleInline({ theme, element: 'h4', style: baseStyle })}>{children}</h4>
  ),
  h5: ({ children }: { children: React.ReactNode }) => (
    <h5 style={getTypographyStyleInline({ theme, element: 'h5', style: baseStyle })}>{children}</h5>
  ),
  p: ({ children }: { children: React.ReactNode }) => (
    <p style={getTypographyStyleInline({ theme, element: 'body', style: baseStyle })}>{children}</p>
  ),
  blockquote: ({ children }: { children: React.ReactNode }) => (
    <blockquote style={getTypographyStyleInline({ theme, element: 'label', style: baseStyle })}>{children}</blockquote>
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props} style={{ textDecoration: 'underline', ...getTypographyStyleInline({ theme, element: 'body', style: baseStyle }), ...(props.style || {}) }} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code {...props} style={getTypographyStyleInline({ theme, element: 'body', style: { ...(baseStyle || {}), fontFamily: (theme as any)?.mono_font, ...(props.style || {}) } })} />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre {...props} style={getTypographyStyleInline({ theme, element: 'body', style: { ...(baseStyle || {}), fontFamily: (theme as any)?.mono_font, ...(props.style || {}) } })} />
  ),
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul style={getTypographyStyleInline({ theme, element: 'body', style: baseStyle })}>{children}</ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => (
    <ol style={getTypographyStyleInline({ theme, element: 'body', style: baseStyle })}>{children}</ol>
  ),
  li: ({ children }: { children: React.ReactNode }) => (
    <li style={getTypographyStyleInline({ theme, element: 'body', style: baseStyle })}>{children}</li>
  ),
});

const preserveAllLineBreaks = (text: string) => {
  return (text || '').split('\n').map(line => {
    // If line is empty, return a non-breaking space
    return line.trim() === '' ? '&nbsp;' : line;
  }).join('\n');
};

export const MarkdownText = ({ text, theme, style, className, ...props }: MarkdownTextProps) => {
  return (
    <div className={cn('numi-markdown whitespace-pre-line', className)} {...props}>
      <ReactMarkdown
        rehypePlugins={[rehypeRaw]}
        components={{
          ...componentsForTheme(theme, style),
          h6: ({ children }) => <p style={getTypographyStyleInline({ theme, element: 'body', style })}>{children}</p>,
        }}
      >
        {preserveAllLineBreaks(text ?? '')}
      </ReactMarkdown>
    </div>
  );
};

