import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance, FontValue, Style } from "@/contexts/Numi";
import { useMemo } from "react";
import { resolveThemeValue } from "@/lib/theme";

function TextInputBlockComponent({ context }: { context: BlockContextType }) {

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
    inspector: "hidden"
  });

  const [label] = Numi.useStateString({
    label: 'Label',
    name: 'label',
    defaultValue: '',
  });

  const { isValid, errors, validate } = Numi.useValidation({
    rules: {
      isRequired: true,
    },
  });
  
  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
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
    Style.font( 'labelFont', 'Label Font & Color',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
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
  // or, we wrap this manually?

  // const { fields, session } = Numi.useCheckout();

  // validation

  const containerStyle = useMemo(() => ({
    rowGap: resolveThemeValue(appearance.spacing, theme, 'spacing'),
    margin: resolveThemeValue(appearance.margin, theme, 'margin'),
    alignItems: style.alignment != 'expand' ? style.alignment : 'flex-start'
  }), [appearance, style]);

  const labelFont = resolveThemeValue(style?.font, theme, 'label_typography') as FontValue;
  
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
    backgroundColor: style.inputBackgroundColor ?? 'white',
    color: style.inputFont?.color ?? 'black',
    fontFamily: style.inputFont?.font,
    fontWeight: style.inputFont?.weight,
    fontSize: style.inputFont?.size,
    lineHeight: style.inputFont?.lineHeight,
    borderColor: style.borderColor,
    borderWidth: style.border?.width ?? '0.5px',
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius,
  }), [style]);
  
  return (
    <div className='flex flex-col' style={containerStyle}>
      {label && <label htmlFor="" style={labelStyles}>{label}</label>}
      <div className="flex flex-row" style={{ width: style.alignment == 'expand' ? '100%' : 'auto' }}>
        <input 
          id={id}
          className="border border-gray-300 rounded-md p-2"
          type="text" 
          value={text}
          onChange={(e) => setText(e.target.value)} 
          style={inputStyles}
        />
      </div>
    </div>
  );
}

export default TextInputBlockComponent;