import { BlockContextType } from "@/types/blocks";
import ReactMarkdown from 'react-markdown';
import Numi from "@/contexts/Numi";
import { cn } from "@/lib/utils";


// Block Components
function TextBlockComponent({ context }: { context: BlockContextType }) {
  const [text, setText, format] = Numi.useStateString({
    name: 'value',
    defaultValue: 'Default Text!',
  });

  const { fontWeight, fontSize } = context.blockConfig.appearance ?? {};
  const isMarkdown = format === 'markdown';

  if (context.blockConfig.appearance?.isHidden) {
    return <div>{context.blockConfig.id} is hidden!</div>
  }

  return (
    <div
      className={cn(
        "prose max-w-none",
        isMarkdown && "prose-gray"
      )}
      id={context.blockId}
      style={{ fontWeight: fontWeight, fontSize: fontSize }}
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