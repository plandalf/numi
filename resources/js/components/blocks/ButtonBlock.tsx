import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance } from "@/contexts/Numi";
import cx from "classnames";

// Does Submitting of field forms. 
function ButtonBlockComponent({ context }: { context: BlockContextType }) {

  const [text] = Numi.useStateString({
    name: 'value',
    defaultValue: 'Submit',
  });
  
  const [type] = Numi.useStateEnumeration({
    name: 'type',
    initialValue: 'submit',
    options: ['submit', 'button', 'reset'],
    labels: {
      submit: 'Submit',
      button: 'Button',
      reset: 'Reset',
    },
    inspector: 'select',
    label: 'Type',
  })

  const appearance = Numi.useAppearance([
    Appearance.alignment(['left', 'center', 'right', 'expand']),
    Appearance.backgroundColor(),
    Appearance.textColor(),
    Appearance.fontWeight(['normal', 'semibold']),
    Appearance.border()
  ]);

  const onClick = Numi.useEventCallback({
    name: 'click',
  });

  return (
    <button 
      type={type} 
      className={cx({
        "border border-gray-300 rounded-md p-2": true,
        "hover:cursor-pointer hover:brightness-90 active:brightness-85": true,
        "w-full ": appearance.alignment === 'expand',
        "font-semibold": appearance.fontWeight === 'semibold',
      })}
      style={{
        backgroundColor: appearance.backgroundColor || 'white',
        color: appearance.textColor || 'black',
        border: appearance.border || '1px solid #ccc',
      }}
      onClick={onClick}
    >  
      {text}
    </button>
  );
}
export default ButtonBlockComponent;