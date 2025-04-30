import { BlockContextType } from "@/types/blocks";
import ReactMarkdown from 'react-markdown';
import Numi from "@/contexts/Numi";
import { cn } from "@/lib/utils";

function PlanDescriptorComponent({ context }: { context: BlockContextType }) {
  const [text, setText, format] = Numi.useStateString({
    name: 'value',
    defaultValue: 'Plan Description',
  });

  const { fontWeight, fontSize, textColor } = context.blockConfig.appearance ?? {};
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
      style={{
        fontWeight: fontWeight,
        fontSize: fontSize,
        color: textColor
      }}
    >
      {isMarkdown ? (
        <ReactMarkdown>{text}</ReactMarkdown>
      ) : (
        text
      )}
    </div>
  );
}

export default PlanDescriptorComponent;
