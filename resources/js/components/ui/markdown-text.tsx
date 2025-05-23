import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface MarkdownTextProps {
  text: string;
  className?: string;
}

const preserveAllLineBreaks = (text: string) => {
  return text.replace(/\n/g, '  \n');
};

export const MarkdownText = ({ text, className, ...props }: MarkdownTextProps) => {

  return (
    <div className={cn("numi-markdown", className)} {...props}>
      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
        {preserveAllLineBreaks(text)}
      </ReactMarkdown>
    </div>
  );
}

