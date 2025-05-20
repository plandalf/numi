import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";

function preserveAllLineBreaks(text: string): string {
  return text.replace(/\n/g, '<br/>');
}

export const MarkdownText = ({ text }: { text: string }) => {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
    >
      {preserveAllLineBreaks(text)}
    </ReactMarkdown>
  );
};

