import Numi, { Style, Conditions, FontValue, BorderValue, DimensionValue, Appearance } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Switch } from "@/components/ui/switch";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { resolveThemeValue } from "@/lib/theme";

function CheckboxBlockComponent({ context }: { context: BlockContextType }) {

  const theme = Numi.useTheme();

  const [id] = Numi.useStateString({
    label: 'Field Name',
    name: 'id',
    defaultValue: '',
  });

  const [checked, setChecked] = Numi.useStateBoolean({
    label: 'Checked',
    name: 'value',
    defaultValue: false,
    inspector: 'hidden',
  });

  const [checkboxStyle] = Numi.useStateEnumeration({
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
    label: 'Label',
    name: 'label',
    defaultValue: 'Checked?',
  });

  const [isDefaultChecked, setIsDefaultChecked] = Numi.useStateBoolean({
    name: 'is_default_checked',
    label: 'Default Checked',
    defaultValue: false,
  });

  // validation rules~
  const { isValid, errors, validate } = Numi.useValidation({
    rules: {
      isRequired: false,
    },
  });

  const { isDisabled } = Numi.useInteraction();
  const { executeCallbacks } = Numi.useEventCallback({
    name: 'checkbox',
    elements: [
      { value: id, label: id }
    ],
    events: [{
      label: EVENT_LABEL_MAP[Event.onSelect],
      events: [Event.onSelect, Event.onUnSelect]
    }],
  });

  function handleChange() {
    const newChecked = !checked;
    setChecked(newChecked);
    executeCallbacks(newChecked ? Event.onSelect : Event.onUnSelect);
  }

  const appearance = Numi.useAppearance([
    Appearance.margin('margin', 'Margin', {}),
    Appearance.padding('padding', 'Padding', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const style = Numi.useStyle([
    Style.backgroundColor('activeBackgroundColor', 'Selected Color', {}, '#0374ff'),
    Style.backgroundColor('inactiveBackgroundColor', 'Unselected Color', {}, '#E5E5E5'),
    Style.textColor('checkColor', 'Check Color', {}, '#FFFFFF'),
    Style.font('font', 'Label Font & Color',
      {
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        },
      },
      {},
    ),
    Style.border('border', 'Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '5px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#E5E5E5'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const font = style?.font as FontValue;
  const border = style?.border as BorderValue;
  const borderColor = style?.borderColor;
  const checkColor = style?.checkColor;
  const backgroundColorActive = style?.activeBackgroundColor;
  const backgroundColorInactive = style?.inactiveBackgroundColor;
  const borderRadius = style?.borderRadius;
  const shadow = style?.shadow as string;

  const isManuallyStyledCheckbox = (borderRadius != undefined || backgroundColorActive != undefined || backgroundColorInactive != undefined);

  const containerStyles = useMemo(() => ({
    padding: resolveThemeValue(appearance.padding, theme, 'padding'),
    margin: resolveThemeValue(appearance.margin, theme, 'margin'),
    rowGap: resolveThemeValue(appearance.spacing, theme, 'spacing'),
  }), [appearance]);

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
    color: font?.color,
    fontFamily: font?.font,
    fontWeight: font?.weight,
    fontSize: font?.size,
    lineHeight: font?.lineHeight,
    letterSpacing: font?.letterSpacing,
  }), [style, font]);

  const checkIconStyles = useMemo(() => ({
    position: 'absolute',
    pointerEvents: 'none',
    userSelect: 'none',
    width: '10px',
    height: '10px',
    top: '55%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: checkColor || 'white',
  }), [checkColor]);

  const switchThumbStyles = useMemo(() => ({
    backgroundColor: checkColor || 'white',
  }), [checkColor]);

  if (style.hidden) {
    return null;
  }
  
  return (
    <div>
      {checkboxStyle === 'checkbox' && (
        isManuallyStyledCheckbox ? (    
          <div className="flex items-center gap-2" style={containerStyles}>
            <div className="relative flex justify-center">
              <input
                style={checkboxStyles}
                id={id}
                type="checkbox"
                name={context.blockId}
                checked={checked}
                onChange={handleChange}
                defaultValue={isDefaultChecked}
              />
              {(isManuallyStyledCheckbox && checked) && <Check strokeWidth="5" className="pb-0.5" style={checkIconStyles} />}
            </div>
            {label && <span style={checkboxLabelStyles}>{label}</span>}
          </div>
        ) : (
          <div className="flex items-center" style={containerStyles}>
            <input style={checkboxStyles} id={id} type="checkbox" name={context.blockId} checked={checked} onChange={handleChange} />
            {label && <span style={checkboxLabelStyles}>{label}</span>}
          </div>)
      )}
      {checkboxStyle === 'switch' && (
        <div className="flex items-center gap-2" style={containerStyles}>
          <Switch
            style={switchStyles}
            thumbProps={{
              style: switchThumbStyles,
            }}
            checked={checked}
            onCheckedChange={handleChange}
          />
          {label && <span style={checkboxLabelStyles}>{label}</span>}
        </div>
      )}
    </div>
  );
}

export default CheckboxBlockComponent;
