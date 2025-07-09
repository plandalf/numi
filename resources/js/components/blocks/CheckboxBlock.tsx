import Numi, { Style, Appearance } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Switch } from "@/components/ui/switch";
import { useCallback, useMemo } from "react";
import { Check } from "lucide-react";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { resolveThemeValue } from "@/lib/theme";
import { MarkdownText } from "../ui/markdown-text";


function CheckboxBlockComponent({ context }: { context: BlockContextType }) {

  const { errors } = Numi.useCheckout({});
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

  const [checked, setChecked] = Numi.useStateBoolean({
    label: 'Checked',
    name: 'value',
    defaultValue: false,
    inspector: 'hidden',
    asState: true,
  });

  // validation rules~
  const { errors: localErrors, validate } = Numi.useValidation({
    rules: {
      isRequired: context.blockConfig.validation?.isRequired ?? false,
    },
  });

  // Get errors from global state or local validation
  const blockErrors = errors[context.blockId] || localErrors;
  const hasErrors = blockErrors && blockErrors.length > 0;

  const { executeCallbacks } = Numi.useEventCallback({
    name: 'checkbox',
    elements: [
      { value: id, label: id }
    ],
    events: [{
      label: EVENT_LABEL_MAP[Event.onSelect],
      events: [Event.onSelect, Event.onUnSelect],
      required: true,
    }],
  });

  const handleChange = useCallback(() => {
    const newChecked = !checked;
    setChecked(newChecked);
    executeCallbacks(newChecked ? Event.onSelect : Event.onUnSelect);
    
    // Validate on change if required
    if (context.blockConfig.validation?.isRequired) {
      validate(newChecked);
    }
  }, [executeCallbacks, checked, setChecked, validate, context.blockConfig.validation?.isRequired]);

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}, '0px'),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const fontConfig = {
    config: {
      hideVerticalAlignment: true,
      hideHorizontalAlignment: true,
    },
  };

  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {}, 'left'),
    Style.font('labelFont', 'Label Font & Color', fontConfig, theme?.label_typography),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, theme?.primary_surface_color),
    Style.border('border', 'Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, theme?.border_radius),
    Style.borderColor('borderColor', 'Border Color', {}, theme?.primary_border_color),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const containerStyle = useMemo(() => ({
    rowGap: appearance.spacing,
    margin: appearance.margin,
    alignItems: style.alignment != 'expand' ? style.alignment : 'flex-start'
  }), [appearance, style]);

  const labelStyles = useMemo(() => ({
    color: (resolveThemeValue(style?.labelFont?.color, theme) as string) || '#000000',
    fontFamily: style?.labelFont?.font || 'Inter, sans-serif',
    fontWeight: style?.labelFont?.weight || '400',
    fontSize: style?.labelFont?.size || '14px',
    lineHeight: style?.labelFont?.lineHeight || '1.5',
  }), [style?.labelFont, theme]);

  const checkboxStyles = useMemo(() => ({
    backgroundColor: (resolveThemeValue(style.backgroundColor, theme) as string) || '#ffffff',
    borderColor: hasErrors ? '#ef4444' : ((resolveThemeValue(style.borderColor, theme) as string) || '#d1d5db'),
    borderWidth: style.border?.width || '1px',
    borderStyle: style.border?.style || 'solid',
    borderRadius: style.borderRadius || '4px',
  }), [style, hasErrors, theme]);

  const errorStyles = useMemo(() => ({
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '4px',
    fontFamily: 'Inter, sans-serif',
  }), []);

  if (style.hidden) {
    return null;
  }

  return (
    <div className='flex flex-col' style={containerStyle}>
      <div className="flex items-center gap-2" style={{ width: style.alignment == 'expand' ? '100%' : 'auto' }}>
        {checkboxStyle === 'switch' ? (
          <Switch
            id={id || `checkbox-${context.blockId}`}
            checked={checked}
            onCheckedChange={handleChange}
            style={checkboxStyles}
          />
        ) : (
          <div
            id={id || `checkbox-${context.blockId}`}
            className="flex items-center justify-center cursor-pointer"
            style={{
              width: '20px',
              height: '20px',
              ...checkboxStyles
            }}
            onClick={handleChange}
          >
            {checked && (
              <Check
                size={14}
                color={(resolveThemeValue(style.labelFont?.color, theme) as string) || '#000000'}
              />
            )}
          </div>
        )}
        {label && (
          <label 
            htmlFor={id || `checkbox-${context.blockId}`} 
            style={labelStyles} 
            className="cursor-pointer flex-1"
          >
            <MarkdownText text={label} />
          </label>
        )}
      </div>
      {hasErrors && (
        <div style={errorStyles}>
          {blockErrors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CheckboxBlockComponent;
