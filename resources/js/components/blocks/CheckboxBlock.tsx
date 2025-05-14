import Numi, { Style, Conditions } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Switch } from "@/components/ui/switch";

function CheckboxBlockComponent({ context }: { context: BlockContextType }) {

  const [id] = Numi.useStateString({
    name: 'Field Name',
    defaultValue: '',
  });

  const [checked, setChecked] = Numi.useStateBoolean({
    name: 'value',
    defaultValue: false,
    inspector: 'hidden',
  });

  const [style] = Numi.useStateEnumeration({
    name: 'style',
    initialValue: 'checkbox',
    options: ['checkbox', 'switch'],
    labels: {
      checkbox: 'Checkbox',
      switch: 'Switch',
    } as Record<string, string>,
    inspector: 'select',
    label: 'Style',
  });

  const [label] = Numi.useStateString({
    name: 'label',
    defaultValue: 'Checked?',
  });

  const [isDefaultChecked, setIsDefaultChecked] = Numi.useStateBoolean({
    name: 'is_default_checked',
    label: 'Default Checked',
    defaultValue: false,
  });

  function handleChange() {
    setChecked(!checked);
  }

  // validation rules~
  const { isValid, errors, validate } = Numi.useValidation({
    rules: {
      isRequired: false,
    },
  });

  const { isDisabled } = Numi.useInteraction();

  const appearance = Numi.useStyle([
    Style.backgroundColor('Background Color', 'backgroundColor', {}, '#FFFFFF'),
    Style.visibility('Visibility', {}, {
      conditional: []
    }),
  ]);

  return (
    <div>
      {style === 'checkbox' && (
        <div>
          <input id={id} type="checkbox" name={context.blockId} checked={checked} onChange={handleChange} /> {label}
        </div>
      )}
      {style === 'switch' && (
        <div className="flex items-center gap-2">
          <Switch
            checked={checked}
            onCheckedChange={handleChange}
          /> {label}
        </div>
      )}
    </div>
  );
}

export default CheckboxBlockComponent;
