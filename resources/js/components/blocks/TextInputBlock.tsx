import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance, FontValue, Style } from "@/contexts/Numi";
import { useMemo } from "react";
import { resolveThemeValue } from "@/lib/theme";

function TextInputBlockComponent({ context }: { context: BlockContextType }) {
  const { updateSessionProperties, errors } = Numi.useCheckout();
  const theme = Numi.useTheme();

  const [id] = Numi.useStateString({
    label: 'Field Name',
    name: 'id',
    defaultValue: '',
  });

  const [text, setText] = Numi.useStateString({
    label: 'Text',
    name: 'value',
    defaultValue: '',
    inspector: "hidden",
    asState: true,
  });

  const [label] = Numi.useStateString({
    label: 'Label',
    name: 'label',
    defaultValue: '',
  });

  const [validationType] = Numi.useStateEnumeration({
    name: 'validationType',
    initialValue: 'none',
    options: ['none', 'email', 'required'],
    labels: {
      none: 'None',
      email: 'Email',
      required: 'Required',
    },
    inspector: 'select',
    label: 'Validation Type',
  });

  const { isValid, errors: localErrors, validate, validateField } = Numi.useValidation({
    rules: {
      isRequired: validationType === 'required' || context.blockConfig.validation?.isRequired,
      email: validationType === 'email' || context.blockConfig.validation?.email,
      pattern: context.blockConfig.validation?.pattern,
      patternMessage: context.blockConfig.validation?.patternMessage,
      minLength: context.blockConfig.validation?.minLength,
      maxLength: context.blockConfig.validation?.maxLength,
    },
  });

  // Get errors from global state or local validation
  const blockErrors = errors[context.blockId] || localErrors;
  const hasErrors = blockErrors && blockErrors.length > 0;

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
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
    Style.alignment('alignment', 'Alignment', {}, 'expand'),
    Style.font( 'labelFont', 'Label Font & Color', fontConfig, theme?.label_typography as FontValue),
    Style.backgroundColor('inputBackgroundColor', 'Input Background Color', {}, '#FFFFFF'),
    Style.font('inputFont', 'Input Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '14px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.border('border', 'Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, theme?.border_radius),
    Style.borderColor('borderColor', 'Border Color', {}, theme?.primary_border_color),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const { isDisabled } = Numi.useInteraction();

  const containerStyle = useMemo(() => ({
    rowGap: appearance.spacing,
    margin: appearance.margin,
    alignItems: style.alignment != 'expand' ? style.alignment : 'flex-start'
  }), [appearance, style]);

  const labelFont = {
    ...resolveThemeValue(style?.labelFont, theme, 'label_typography') as FontValue,
    color: resolveThemeValue(style?.labelFont?.color, theme),
  };

  const labelStyles = useMemo(() => ({
    color: labelFont?.color,
    fontFamily: labelFont?.font,
    fontWeight: labelFont?.weight,
    fontSize: labelFont?.size,
    lineHeight: labelFont?.lineHeight,
  }), [labelFont]);

  const inputStyles = useMemo(() => ({
    padding: resolveThemeValue(appearance.padding, theme, 'padding'),
    width: style.alignment == 'expand' ? '100%' : 'auto',
    backgroundColor: resolveThemeValue(style.inputBackgroundColor, theme),
    color: resolveThemeValue(style.inputFont?.color, theme),
    fontFamily: style.inputFont?.font,
    fontWeight: style.inputFont?.weight,
    fontSize: style.inputFont?.size,
    lineHeight: style.inputFont?.lineHeight,
    borderColor: hasErrors ? '#ef4444' : resolveThemeValue(style.borderColor, theme),
    borderWidth: style.border?.width ?? '0.5px',
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius,
  }), [style, hasErrors]);

  const errorStyles = useMemo(() => ({
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '4px',
    fontFamily: style.inputFont?.font || 'Inter',
  }), [style.inputFont?.font]);

  const onTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {  
    const newValue = e.target.value;
    setText(newValue);
    
    // Validate on change if there are validation rules
    if (validationType !== 'none' || context.blockConfig.validation) {
      validate(newValue);
    }
  };

  return (
    <div className='flex flex-col' style={containerStyle}>
      {label && <label htmlFor={id} style={labelStyles}>{label}</label>}
      <div className="flex flex-row" style={{ width: style.alignment == 'expand' ? '100%' : 'auto' }}>
        <input
          id={id}
          className="border border-gray-300 rounded-md p-2"
          type={validationType === 'email' ? 'email' : 'text'}
          value={text}
          onChange={onTextChange}
          style={inputStyles}
          disabled={isDisabled}
        />
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

export default TextInputBlockComponent;
