import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance } from "@/contexts/Numi";
import cx from "classnames";
import { useCheckoutState } from "@/pages/checkout-main";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

// Does Submitting of field forms.
function ButtonBlockComponent({ context }: { context: BlockContextType }) {
  const { isSubmitting, submitError } = useCheckoutState();

  // console.log({ isSubmitting, submitError });

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
  });

  const appearance = Numi.useAppearance([
    Appearance.alignment(['left', 'center', 'right', 'expand']),
    Appearance.backgroundColor(),
    Appearance.textColor(),
    Appearance.fontWeight(['normal', 'semibold']),
    Appearance.border(),
    Appearance.borderColor(),
    Appearance.hidden(),
  ]);

  const onClick = Numi.useEventCallback({
    name: 'click',
  });

  const buttonStyles = useMemo(() => ({
    backgroundColor: appearance.backgroundColor || 'white',
    color: appearance.textColor || 'black',
    borderColor: `${appearance.borderColor || '#ccc'}`,
  }), [appearance.backgroundColor, appearance.textColor, appearance.borderColor]);

  const buttonClasses = useMemo(() => cx({
    "border border-gray-300 rounded-md p-2": true,
    "hover:cursor-pointer hover:brightness-90 active:brightness-85": !isSubmitting,
    "w-full": appearance.alignment === 'expand',
    "font-semibold": appearance.fontWeight === 'semibold',
    "font-bold": appearance.fontWeight === 'bold',
    "opacity-50 cursor-not-allowed": isSubmitting,
    "border-none": appearance.border === 'none',
    "border-[1px]": appearance.border === 'xs',
    "border-[4px]": appearance.border === 'sm',
    "border-[8px]": appearance.border === 'md',
    "border-[12px]": appearance.border === 'lg',
    "border-[16px]": appearance.border === 'xl',
  }), [appearance.alignment, appearance.fontWeight, appearance.border, isSubmitting]);

  const containerClasses = useMemo(() => cn("space-y-2 flex", {
    "justify-start": appearance.alignment === 'left',
    "justify-center": appearance.alignment === 'center',
    "justify-end": appearance.alignment === 'right',
    "justify-stretch": appearance.alignment === 'expand',
  }), [appearance.alignment]);

  if (appearance.hidden) {
    return null;
  }

  return (
    <div className={containerClasses}>
      <button
        type={type}
        disabled={type === 'submit' && isSubmitting}
        className={buttonClasses}
        style={buttonStyles}
        onClick={onClick}
      >
        {type === 'submit' && isSubmitting ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </div>
        ) : (
          text
        )}
      </button>
      {type === 'submit' && submitError && (
        <div className="text-sm text-red-600">
          {submitError}
        </div>
      )}
    </div>
  );
}

export default ButtonBlockComponent;
