import Numi, { Style, Conditions, FontValue, BorderValue, DimensionValue, Appearance } from "@/contexts/Numi";
import { BlockContextType } from "@/types/blocks";
import { Switch } from "@/components/ui/switch";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import ReactMarkdown from "react-markdown";
import { resolveThemeValue } from "@/lib/theme";
import { MarkdownText } from "../ui/markdown-text";

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
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),
    Style.alignment('alignment', 'Alignment', {
      options: {
        left: 'left',
        center: 'center',
        right: 'right',
      }
    }, 'left'),
    Style.font('titleFont', 'Title Font & Color',fontConfig, theme?.label_typography as FontValue),
    Style.font('descriptionFont', 'Description Font & Color',fontConfig, theme?.body_typography as FontValue),
    Style.backgroundColor('checkboxActiveBackgroundColor', 'Checkbox Selected Color', {}, theme?.primary_color),
    Style.backgroundColor('checkboxInactiveBackgroundColor', 'Checkbox Unselected Color', {}, theme?.primary_contrast_color),
    Style.textColor('checkboxCheckColor', 'Checkbox Check Color', {}, ''),
    Style.font('checkboxLabelFont', 'Checkbox Label Font & Color', fontConfig, {}),
    Style.border('checkboxBorder', 'Checkbox Border', {}, { width: '1px', style: 'solid' }),
    Style.borderRadius('checkboxBorderRadius', 'Checkbox Border Radius', {}, '5px'),
    Style.borderColor('checkboxBorderColor', 'Checkbox Border Color', {}, theme?.primary_border_color),


    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const innerContainerStyles = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.backgroundColor, theme),
    padding: resolveThemeValue(appearance.padding, theme, 'padding'),
    margin: resolveThemeValue(appearance.margin, theme, 'margin'),
    gap: resolveThemeValue(appearance.spacing, theme, 'spacing'),
    borderColor: style.borderColor,
    borderWidth: style.border?.width,
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius,
  }), [appearance]);

  const headerStyles = useMemo(() => ({
    gap: appearance?.spacing,
    textAlign: style.alignment,
  }), [appearance, style]);

  const titleFont = resolveThemeValue(style.titleFont, theme, 'label_typography') as FontValue;
  const descriptionFont = resolveThemeValue(style.descriptionFont, theme, 'body_typography') as FontValue;

  const titleStyles = useMemo(() => ({
    color: resolveThemeValue(titleFont?.color, theme),
    fontFamily: titleFont?.font,
    fontWeight: titleFont?.weight,
    fontSize: titleFont?.size,
    lineHeight: titleFont?.lineHeight,
    letterSpacing: titleFont?.letterSpacing,
  }), [titleFont]);

  const descriptionStyles = useMemo(() => ({
    color: resolveThemeValue(descriptionFont?.color, theme),
    fontFamily: descriptionFont?.font,
    fontWeight: descriptionFont?.weight,
    fontSize: descriptionFont?.size,
    lineHeight: descriptionFont?.lineHeight,
    letterSpacing: descriptionFont?.letterSpacing,
  }), [descriptionFont]);

  const checkboxLabelFont = resolveThemeValue(style?.checkboxLabelFont, theme, 'label_typography') as FontValue;
  const checkboxActiveBackgroundColor = resolveThemeValue(style?.checkboxActiveBackgroundColor, theme, 'primary_color');
  const checkboxInactiveBackgroundColor = resolveThemeValue(style?.checkboxInactiveBackgroundColor, theme);
  const checkboxCheckColor = resolveThemeValue(style?.checkboxCheckColor, theme, 'primary_contrast_color');
  const checkboxBorderColor = resolveThemeValue(style?.checkboxBorderColor, theme, 'primary_border_color');

  const checkboxStyles = useMemo(() => ({
    backgroundColor: checked ? checkboxActiveBackgroundColor : checkboxInactiveBackgroundColor,
    borderColor: checkboxBorderColor,
    borderWidth: style.checkboxBorder?.width,
    borderStyle: style.checkboxBorder?.style,
    borderRadius : style.checkboxBorderRadius,
    appearance: 'none',
    width: '14px',
    height: '14px',
  }), [
    style,
    checked,
    checkboxBorderColor,
    checkboxActiveBackgroundColor,
    checkboxInactiveBackgroundColor
  ]);

  const switchStyles = useMemo(() => ({
    backgroundColor: checked ? checkboxActiveBackgroundColor : checkboxInactiveBackgroundColor,
    borderColor: checkboxBorderColor,
    borderWidth: style.checkboxBorder?.width,
    borderStyle: style.checkboxBorder?.style,
  }), [
    appearance,
    style,
    checked,
  ]);

  const checkboxLabelStyles = useMemo(() => ({
    color: resolveThemeValue(checkboxLabelFont?.color, theme),
    fontFamily: checkboxLabelFont?.font,
    fontWeight: checkboxLabelFont?.weight,
    fontSize: checkboxLabelFont?.size,
    lineHeight: checkboxLabelFont?.lineHeight,
    letterSpacing: checkboxLabelFont?.letterSpacing,
  }), [checkboxLabelFont]);

  const checkIconStyles = useMemo(() => ({
    position: 'absolute',
    pointerEvents: 'none',
    userSelect: 'none',
    width: '10px',
    height: '10px',
    top: '55%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: checkboxCheckColor,
  }), [checkboxCheckColor]);

  const switchThumbStyles = useMemo(() => ({
    backgroundColor: checkboxCheckColor,
  }), [checkboxCheckColor]);

  if (style.hidden) {
    return null;
  }
  const labelComponent = (
    label && <span style={checkboxLabelStyles}>{label}</span>
  );

  return (
    <div className="flex flex-col gap-3" style={innerContainerStyles}>
      {(title || description) && (
        <div className="flex flex-col gap-2" style={headerStyles}>
          <MarkdownText theme={theme} text={title} style={titleStyles} />
          <MarkdownText theme={theme} text={description} style={descriptionStyles} />
        </div>
      )}
      {checkboxStyle === 'checkbox' && (   
        <div className="flex items-center gap-2">
          <div className="relative inline-block justify-center">
            <input style={checkboxStyles} id={id} type="checkbox" name={context.blockId} checked={checked} onChange={handleChange} />
            {(checked) && <Check strokeWidth="5" className="pb-0.5" style={checkIconStyles} />}
          </div>
          {label && labelComponent}
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
            {label && labelComponent}
        </div>
      )}
    </div>
  );
}

export default AddOnBlockComponent;
