import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance } from "@/contexts/Numi";
import { useMemo } from "react";

function TextInputBlockComponent({ context }: { context: BlockContextType }) {

  const [id] = Numi.useStateString({
    name: 'Field Name',
    defaultValue: '',
  });

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
  
  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const { isDisabled } = Numi.useInteraction();
  // or, we wrap this manually?

  // const { fields, session } = Numi.useCheckout();

  // validation

  const containerStyle = useMemo(() => {
    return {
      padding: appearance.padding,
      rowGap: appearance.spacing,

    };
  }, [appearance]);

  return (
    <div className='flex flex-col' style={containerStyle}>
      <label htmlFor="">{label}</label>
      <div className="flex flex-row">
        <input 
          id={id}
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