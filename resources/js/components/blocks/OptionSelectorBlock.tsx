import Numi from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { cx } from "class-variance-authority";

function OptionSelectorComponent({ context }: { context: BlockContextType }) {

  const [value, setValue] = Numi.useStateString({
    name: 'value',
    defaultValue: '',
    inspector: 'hidden',
  });

  const [options] = Numi.useStateJsonSchema({
    name: 'options',
    schema: {
      $schema: 'http://json-schema.org/draft-07/schema#',
      type: 'array',
      items: {
        type: 'string',
      },
    },
  });

  const [appearance] = Numi.useStateEnumeration({
    name: 'appearance',
    initialValue: 'select',
    options: ['select', 'segmented'],
    labels: {
      select: 'Select',
      segmented: 'Segmented',
    } as Record<string, string>,
    inspector: 'select',
    label: 'Appearance',
  });

  // const onChange = Numi.useEventCallback({ name: 'change' })

  return (
    <div>
      {/*<div className="text-xs bg-gray-100">OptionSelectorComponent: {context.blockId}</div>*/}
      {appearance === 'select' && (
        <select value={value} onChange={(e) => setValue(e.target.value)}>
          {context.blockConfig.content.options.map((option: any) => (
            <option value={option}>{context.blockConfig.content.labels[option] ?? option}</option>
          ))}
        </select>
      )}
      {appearance === 'segmented' && (
        <div className="flex gap-2">
          {context.blockConfig.content.options.map((option: any) => (
            <button
            type="button"
            className={cx({
              "border border-gray-300 rounded-md p-2": true,
              "bg-gray-100 text-gray-600": value === option,
            })}
            onClick={() => setValue(option)}
            key={option}>{context.blockConfig.content.labels[option] ?? option}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default OptionSelectorComponent;
