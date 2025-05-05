import Numi from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { cx } from "class-variance-authority";

function OptionSelectorComponent({ context }: { context: BlockContextType }) {

  const [id] = Numi.useStateString({
    name: 'Field Name',
    defaultValue: '',
  });

  const [value, setValue] = Numi.useStateString({
    name: 'value',
    defaultValue: '',
    inspector: 'hidden',
  });

  const [options] = Numi.useStateJsonSchema({
    name: 'options',
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "array",
      items: {
        type: "object",
        properties: {
          label: {
            title: "Label",
            type: "string" 
          },
          value: { 
            title: "Value",
            type: "string" 
          },
        },
        required: ["label", "value"]
      }
    }
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

  return (
    <div>
      {appearance === 'select' && (
        <select id={id} value={value} onChange={(e) => setValue(e.target.value)} >
          {(context.blockConfig.content?.options || []).map((option: any) => (
            <option value={option.value}>{option.label}</option>
          ))}
        </select>
      )}
      {appearance === 'segmented' && (
        <div className="flex">
          <input id={id} type='hidden' value={value} />
          {(context.blockConfig.content?.options || options).map((option: any) => (
            <button
              type="button"
              className={cx({
                "border border-gray-300 rounded-md p-2 cursor-pointer": true,
                "bg-gray-100 text-gray-600": value === option.value,
              })}
              onClick={() => setValue(option?.value)}
              key={option.value}
            >{option?.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

export default OptionSelectorComponent;
