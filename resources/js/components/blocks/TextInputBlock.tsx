import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance, Style } from "@/contexts/Numi";
import { useMemo } from "react";

function TextInputBlockComponent({ context }: { context: BlockContextType }) {

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
    Style.textColor('labelColor', 'Label Color', {}, '#000000'),
    Style.font( 'labelFont', 'Label Font',
      fontConfig,
      {
        font: 'Inter',
        weight: '400',
        size: '16px',
        lineHeight: '1.5',
        letterSpacing: '0px',
      },
    ),
    Style.textColor('inputTextColor', 'Input Text Color', {}, '#000000'),
    Style.backgroundColor('inputBackgroundColor', 'Input Background Color', {}, '#FFFFFF'),
    Style.font('inputFont', 'Input Font',
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
    Style.borderRadius('borderRadius', 'Border Radius', {}, '5px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#bbbbbb'),
    Style.shadow('shadow', 'Shadow', {}, '0px 0px 0px 0px #000000'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const { isDisabled } = Numi.useInteraction();
  // or, we wrap this manually?

  // const { fields, session } = Numi.useCheckout();

  // validation

  const containerStyle = useMemo(() => ({
    padding: appearance.padding,
    rowGap: appearance.spacing,
    margin: appearance.margin,
    alignItems: style.alignment != 'expand' ? style.alignment : 'flex-start'
  }), [appearance, style]);
  
  const labelStyles = useMemo(() => ({
    color: style.labelColor,
    fontFamily: style.labelFont?.font,
    fontWeight: style.labelFont?.weight,
    fontSize: style.labelFont?.size,
    lineHeight: style.labelFont?.lineHeight,
  }), [style]);

  const inputStyles = useMemo(() => ({
    width: style.alignment == 'expand' ? '100%' : 'auto',
    backgroundColor: style.inputBackgroundColor ?? 'white',
    color: style.inputTextColor ?? 'black',
    fontFamily: style.inputFont?.font,
    fontWeight: style.inputFont?.weight,
    fontSize: style.inputFont?.size,
    lineHeight: style.inputFont?.lineHeight,
    borderColor: style.borderColor,
    borderWidth: style.border?.width ?? '0.5px',
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius,
    boxShadow: style.shadow,
  }), [style]);
  
  return (
    <div className='flex flex-col' style={containerStyle}>
      <label htmlFor="" style={labelStyles}>{label}</label>
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