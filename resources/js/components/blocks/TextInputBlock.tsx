import { BlockContextType } from "@/types/blocks";
import Numi from "@/contexts/Numi";

function TextInputBlockComponent({ context }: { context: BlockContextType }) {
  const [text, setText] = Numi.useStateString({
    name: 'value',
    defaultValue: 'SHIT',
    inspector: "hidden"
  });

  const [label] = Numi.useStateString({
    name: 'label',
    defaultValue: 'No Label',
  });

  const { isValid, errors, validate } = Numi.useValidation({
    rules: {
      isRequired: true,
    },
  });

  const { isDisabled } = Numi.useInteraction();
  // or, we wrap this manually?

  // const { fields, session } = Numi.useCheckout();

  // validation

  return (
    <div>
      <label htmlFor="">{label}</label>
      <div>
        <input 
        className="border border-gray-300 rounded-md p-2"
        type="text" 
        value={text}
        onChange={(e) => setText(e.target.value)} 
        />
      </div>
    </div>
  );
}

export default TextInputBlockComponent;