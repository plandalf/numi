import Numi, { Style, Conditions, FontValue, BorderValue, DimensionValue, Appearance } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Switch } from "@/components/ui/switch";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import ReactMarkdown from "react-markdown";
import { resolveThemeValue } from "@/lib/theme";

function AddOnBlockComponent({ context }: { context: BlockContextType }) {

  const theme = Numi.useTheme();

  const [id] = Numi.useStateString({
    label: 'Field Name',
    name: 'id',
    defaultValue: '',
  });

  const [title] = Numi.useStateString({
    label: 'Title',
    name: 'title',
    defaultValue: '',
  });

  const [description, setDescription, format] = Numi.useStateString({
    label: 'Description',
    name: 'description',
    defaultValue: '',
    inspector: 'multiline',
    format: 'markdown',
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
    defaultValue: 'I agree to the terms and conditions',
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

  const isMarkdown = format === 'markdown';

  function handleChange() {
    const newChecked = !checked;
    setChecked(newChecked);
    executeCallbacks(newChecked ? Event.onSelect : Event.onUnSelect);
  }

  const appearance = Numi.useAppearance([
    Appearance.margin('margin', 'Margin', {}),
    Appearance.padding('outerPadding', 'Outer Padding', { config: { hideTabs: true }}),
    Appearance.padding('innerPadding', 'Inner Padding', {}),
    Appearance.spacing('spacing', 'Spacing', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const style = Numi.useStyle([
    Style.backgroundColor('backgroundColor', 'Background Color', {}, '#FFFFFF'),
    Style.alignment('alignment', 'Alignment', {
      options: {
        left: 'left',
        center: 'center',
        right: 'right',
      }
    }, 'left'),
    Style.font('titleFont', 'Title Font & Color',
      {
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        },
      },
      {},
    ),
    Style.font('descriptionFont', 'Description Font & Color',
      {
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        },
      },
      {
        color: '#E5E5E5'
      },
    ),


    Style.backgroundColor('checkboxActiveBackgroundColor', 'Checkbox Selected Color', {}, '#0374ff'),
    Style.backgroundColor('checkboxInactiveBackgroundColor', 'Checkbox Unselected Color', {}, '#E5E5E5'),
    Style.textColor('checkboxCheckColor', 'Checkbox Check Color', {}, '#FFFFFF'),
    Style.font('checkboxLabelFont', 'Checkbox Label Font & Color',
      {
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        },
      },
      {
        color: '#000000',
      },
    ),
    Style.border('checkboxBorder', 'Checkbox Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('checkboxBorderRadius', 'Checkbox Border Radius', {}, '5px'),
    Style.borderColor('checkboxBorderColor', 'Checkbox Border Color', {}, '#E5E5E5'),
    Style.shadow('checkboxShadow', 'Checkbox Shadow', {}, '0px 0px 0px 0px #000000'),

  
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '1px'),
    Style.borderColor('borderColor', 'Border Color', {}, '#E5E5E5'),
    Style.shadow('shadow', 'Shadow', {}, '0px 0px 0px 0px #000000'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const containerStyles = useMemo(() => ({
    backgroundColor: style.backgroundColor,
    padding: appearance.innerPadding,
  }), [appearance]);

  const innerContainerStyles = useMemo(() => ({
    padding: resolveThemeValue(appearance.innerPadding, theme, 'padding'),
    margin: resolveThemeValue(appearance.margin, theme, 'margin'),
    gap: resolveThemeValue(appearance.spacing, theme, 'spacing'),
    borderColor: style.borderColor || '#E5E5E5',
    borderWidth: style.border?.width ?? '0px',
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius,
    boxShadow: style.shadow,
  }), [appearance]);

  const headerStyles = useMemo(() => ({
    gap: appearance?.spacing,
    textAlign: style.alignment,
  }), [appearance, style]);

  const titleStyles = useMemo(() => ({
    color: style.titleColor || 'black',
    fontFamily: style.titleFont?.font,
    fontWeight: style.titleFont?.weight,
    fontSize: style.titleFont?.size,
    lineHeight: style.titleFont?.lineHeight,
    letterSpacing: style.titleFont?.letterSpacing,
  }), [style]);

  const descriptionStyles = useMemo(() => ({
    color: style.descriptionFont?.color,
    fontFamily: style.descriptionFont?.font,
    fontWeight: style.descriptionFont?.weight,
    fontSize: style.descriptionFont?.size,
    lineHeight: style.descriptionFont?.lineHeight,
    letterSpacing: style.descriptionFont?.letterSpacing,
  }), [style]);

  const checkboxStyles = useMemo(() => ({
    backgroundColor: checked ? (style.checkboxActiveBackgroundColor || '#0374ff') : (style.checkboxInactiveBackgroundColor || '#E5E5E5'),
    borderColor: style.checkboxBorderColor || '#E5E5E5',
    borderWidth: style.checkboxBorder?.width ?? '0.5px',
    borderStyle: style.checkboxBorder?.style,
    borderRadius : style.checkboxBorderRadius,
    boxShadow: style.checkboxShadow,
    appearance: 'none',
    width: '14px',
    height: '14px',
  }), [
    appearance,
    style,
    checked,
  ]);

  const switchStyles = useMemo(() => ({
    backgroundColor: checked ? style.checkboxActiveBackgroundColor : (style.checkboxInactiveBackgroundColor || '#E5E5E5'),
    borderColor: style.checkboxBorderColor || '#E5E5E5',
    borderWidth: style.checkboxBorder?.width ?? '0.5px',
    borderStyle: style.checkboxBorder?.style,
    borderRadius : style.checkboxBorderRadius,
    boxShadow: style.checkboxShadow,
  }), [
    appearance,
    style,
    checked,
  ]);

  const checkboxLabelStyles = useMemo(() => ({
    color: style.checkboxLabelFont?.color,
    fontFamily: style.checkboxLabelFont?.font,
    fontWeight: style.checkboxLabelFont?.weight,
    fontSize: style.checkboxLabelFont?.size,
    lineHeight: style.checkboxLabelFont?.lineHeight,
    letterSpacing: style.checkboxLabelFont?.letterSpacing,
  }), [style]);

  const checkIconStyles = useMemo(() => ({
    position: 'absolute',
    pointerEvents: 'none',
    userSelect: 'none',
    width: '10px',
    height: '10px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: style.checkboxCheckColor || 'white',
  }), [style]);

  const switchThumbStyles = useMemo(() => ({
    backgroundColor: style.checkboxCheckColor || 'white',
  }), [style]);

  if (style.hidden) {
    return null;
  }

  console.log('description, checkboxStyle', description, checkboxStyle)
  
  return (
    <div className="flex flex-col gap-3" style={containerStyles}>
      <div className="flex flex-col gap-3 p-4" style={innerContainerStyles}>
        {(title || description) && (
          <div className="flex flex-col gap-2" style={headerStyles}>
            <span className="font-bold text-lg" style={titleStyles}>{title}</span>
            <span className="font-normal text-base" style={descriptionStyles}>{
              isMarkdown ? (
                <ReactMarkdown>{description}</ReactMarkdown>
              ) : (
                description
              )}
            </span>
          </div>
        )}
        {checkboxStyle === 'checkbox' && (   
          <div className="flex items-center gap-2">
            <div className="relative inline-block justify-center">
              <input style={checkboxStyles} id={id} type="checkbox" name={context.blockId} checked={checked} onChange={handleChange} />
              {(checked) && <Check strokeWidth="5" className="pb-0.5" style={checkIconStyles} />}
            </div>
            <span style={checkboxLabelStyles}>{label}</span>
          </div>
        )}
        {checkboxStyle === 'switch' && (
          <div className="flex items-center gap-2">
            <Switch
              id={id}
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
    </div>
  );
}

export default AddOnBlockComponent;
