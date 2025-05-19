import { BlockContextType } from "@/types/blocks";
import ReactMarkdown from 'react-markdown';
import Numi, { Appearance } from "@/contexts/Numi";
import { cn } from "@/lib/utils";

function PlanDescriptorComponent({ context }: { context: BlockContextType }) {
  const [text, setText, format] = Numi.useStateString({
    label: 'Text',
    name: 'value',
    defaultValue: 'Plan Description',
  });
    
  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const { fontWeight, fontSize, textColor } = context.blockConfig.appearance ?? {};
  const isMarkdown = format === 'markdown';

  if (context.blockConfig.appearance?.hidden) {
    return null;
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
