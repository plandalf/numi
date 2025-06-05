import Numi, { Style, Conditions, FontValue, BorderValue, DimensionValue, Appearance } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Switch } from "@/components/ui/switch";
import { useCallback, useEffect, useMemo } from "react";
import { Check } from "lucide-react";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { resolveThemeValue } from "@/lib/theme";
import { MarkdownText } from "../ui/markdown-text";

function CheckboxBlockComponent({ context }: { context: BlockContextType }) {

  const theme = Numi.useTheme();

  const [id] = Numi.useStateString({
    label: 'Field Name',
    name: 'id',
    defaultValue: '',
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
    inspector: 'multiline',
    format: 'markdown',
  });

  const [isDefaultChecked] = Numi.useStateBoolean({
    name: 'is_default_checked',
    label: 'Default Checked',
    defaultValue: false,
  });

  const [checked, setChecked] = Numi.useStateBoolean({
    label: 'Checked',
    name: 'value',
    defaultValue: false,
    inspector: 'hidden',
  });

  useEffect(() => {
    setChecked(isDefaultChecked);
  }, [isDefaultChecked]);

  // validation rules~
  const { isValid, errors, validate } = Numi.useValidation({
    rules: {
      isRequired: false,
    },
  });

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

  const handleChange = useCallback(() => {
    const newChecked = !checked;
    setChecked(newChecked);
    executeCallbacks(newChecked ? Event.onSelect : Event.onUnSelect);
  }, [executeCallbacks]);

  const appearance = Numi.useAppearance([
    Appearance.margin('margin', 'Margin', {}),
    Appearance.padding('padding', 'Padding', {}, '0px'),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const style = Numi.useStyle([
    Style.backgroundColor('activeBackgroundColor', 'Selected Color', {}, theme?.primary_color),
    Style.backgroundColor('inactiveBackgroundColor', 'Unselected Color', {}, theme?.primary_contrast_color),
    Style.textColor('checkColor', 'Check Color', {}),
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
    Style.borderColor('borderColor', 'Border Color', {}, theme?.primary_border_color),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const font = style.font;
  const border = style?.border as BorderValue;
  const borderColor = resolveThemeValue(style?.borderColor, theme, 'primary_border_color');
  const checkColor = resolveThemeValue(style?.checkColor, theme, 'primary_contrast_color');
  const backgroundColorActive = resolveThemeValue(style?.activeBackgroundColor, theme, 'primary_color');
  const backgroundColorInactive = resolveThemeValue(style?.inactiveBackgroundColor, theme);
  const borderRadius = style?.borderRadius;
  const shadow = style?.shadow as string;

  const isManuallyStyledCheckbox = (borderRadius != undefined || backgroundColorActive != undefined || backgroundColorInactive != undefined);

  const containerStyles = useMemo(() => ({
    padding: appearance.padding,
    margin: appearance.margin,
    gap: appearance.spacing,
  }), [appearance]);

  const checkboxStyles = useMemo(() => ({
    backgroundColor: checked ? backgroundColorActive : backgroundColorInactive,
    borderColor: borderColor,
    borderWidth: border?.width,
    borderStyle: border?.style,
    borderRadius : borderRadius,
    boxShadow: shadow,
    appearance: 'none',
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
    backgroundColor: checked ? backgroundColorActive : backgroundColorInactive,
    borderColor: borderColor,
    borderWidth: border?.width,
    borderStyle: border?.style,
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
    color: resolveThemeValue(font?.color, theme),
    fontFamily: font?.font,
    fontWeight: font?.weight,
    fontSize: font?.size,
    lineHeight: font?.lineHeight,
    letterSpacing: font?.letterSpacing,
  }), [font]);

  const checkIconStyles = useMemo(() => ({
    position: 'absolute',
    pointerEvents: 'none',
    userSelect: 'none',
    width: '10px',
    height: '10px',
    top: '55%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: checkColor,
  }), [checkColor]);

  const switchThumbStyles = useMemo(() => ({
    backgroundColor: checkColor,
  }), [checkColor]);

  if (style.hidden) {
    return null;
  }

  const labelComponent = (
    label && <MarkdownText text={label} theme={theme} style={checkboxLabelStyles} />
  );

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
              />
              {(isManuallyStyledCheckbox && checked) && <Check strokeWidth="5" className="pb-0.5" style={checkIconStyles} />}
            </div>
            {label && labelComponent}
          </div>
        ) : (
          <div className="flex items-center" style={containerStyles}>
            <input style={checkboxStyles} id={id} type="checkbox" name={context.blockId} checked={checked} onChange={handleChange} />
            {label && labelComponent}
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
          />{label && labelComponent}
        </div>
      )}
    </div>
  );
}

export default CheckboxBlockComponent;
