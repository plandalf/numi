import Numi, { Style, Conditions, FontValue, BorderValue, DimensionValue } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Switch } from "@/components/ui/switch";
import { useMemo } from "react";
import { Check } from "lucide-react";

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
    Style.backgroundColor('activeBackgroundColor', 'Selected Color', {}, '#0374ff'),
    Style.backgroundColor('inactiveBackgroundColor', 'Unselected Color', {}, '#E5E5E5'),
    Style.textColor('checkColor', 'Check Color', {}, '#FFFFFF'),
    Style.textColor('textColor', 'Label Color', {}, '#000000'),
    Style.font(
      'font',
      'Label Font',
      {
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        },
      },
      {
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.border('border', 'Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '5px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#E5E5E5'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const font = appearance?.font as FontValue;
  const border = appearance?.border as BorderValue;
  const borderColor = appearance?.borderColor;
  const checkColor = appearance?.checkColor;
  const backgroundColorActive = appearance?.activeBackgroundColor;
  const backgroundColorInactive = appearance?.inactiveBackgroundColor;
  const borderRadius = appearance?.borderRadius;
  const shadow = appearance?.shadow as string;

  const isManuallyStyledCheckbox = (borderRadius != undefined || backgroundColorActive != undefined || backgroundColorInactive != undefined);

  const checkboxStyles = useMemo(() => ({
    backgroundColor: checked ? (backgroundColorActive || '#0374ff') : (backgroundColorInactive || '#E5E5E5'),
    borderColor: borderColor || '#E5E5E5',
    borderWidth: border?.width ?? '0.5px',
    borderStyle: border?.style,
    borderRadius : borderRadius,
    boxShadow: shadow,
    appearance: isManuallyStyledCheckbox ? 'none' : 'auto',
    ...isManuallyStyledCheckbox ? {
      width: '14px',
      height: '14px',
    } : {},
  }), [
    isManuallyStyledCheckbox,
    backgroundColorActive,
    backgroundColorInactive,
    border,
    borderRadius,
    shadow,
    borderColor,
    checked,
  ]);

  const switchStyles = useMemo(() => ({
    backgroundColor: checked ? backgroundColorActive : (backgroundColorInactive || '#E5E5E5'),
    borderColor: borderColor || '#E5E5E5',
    borderWidth: border?.width ?? '0.5px',
    borderStyle: border?.style,
    borderRadius : borderRadius,
    boxShadow: shadow,
  }), [
    backgroundColorActive,
    backgroundColorInactive,
    border,
    borderRadius,
    shadow,
    borderColor,
    checked,
  ]);

  const checkboxLabelStyles = useMemo(() => ({
    color: appearance.textColor || 'black',
    fontFamily: font?.font,
    fontWeight: font?.weight,
    fontSize: font?.size,
    lineHeight: font?.lineHeight,
    letterSpacing: font?.letterSpacing,
  }), [appearance, font]);

  const checkIconStyles = useMemo(() => ({
    position: 'absolute',
    pointerEvents: 'none',
    userSelect: 'none',
    width: '10px',
    height: '10px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: checkColor || 'white',
  }), [checkColor]);

  const switchThumbStyles = useMemo(() => ({
    backgroundColor: checkColor || 'white',
  }), [checkColor]);

  return (
    <div>
      {style === 'checkbox' && (
        isManuallyStyledCheckbox ? (    
          <div className="flex items-center gap-2">
            <div className="relative inline-block justify-center">
              <input style={checkboxStyles} id={id} type="checkbox" name={context.blockId} checked={checked} onChange={handleChange} />
              {(isManuallyStyledCheckbox && checked) && <Check strokeWidth="5" className="pb-0.5" style={checkIconStyles} />}
            </div>
            <span style={checkboxLabelStyles}>{label}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input style={checkboxStyles} id={id} type="checkbox" name={context.blockId} checked={checked} onChange={handleChange} />
            <span style={checkboxLabelStyles}>{label}</span>
          </div>)
      )}
      {style === 'switch' && (
        <div className="flex items-center gap-2">
          <Switch
            style={switchStyles}
            thumbProps={{
              style: switchThumbStyles,
            }}
            checked={checked}
            onCheckedChange={handleChange}
          />
          <span style={checkboxLabelStyles}>{label}</span>
        </div>
      )}
    </div>
  );
}

export default CheckboxBlockComponent;
