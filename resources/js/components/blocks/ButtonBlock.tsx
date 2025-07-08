import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance, BorderValue, FontValue, IconValue, Style } from '@/contexts/Numi';
import cx from "classnames";
import { useCheckoutState } from "@/pages/checkout-main";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { IconRenderer } from "../ui/icon-renderer";
import { resolveThemeValue } from "@/lib/theme";

// Does Submitting of field forms.
function ButtonBlockComponent({ context }: { context: BlockContextType }) {
  const { isSubmitting, submitError } = useCheckoutState();

  const theme = Numi.useTheme();

  const [text] = Numi.useStateString({
    label: 'Text',
    name: 'value',
    defaultValue: 'Submit',
  });

  const [type] = Numi.useStateEnumeration({
    name: 'type',
    initialValue: 'submit',
    options: ['submit', 'button', 'reset'],
    labels: {
      submit: 'Proceed to Next Page',
      button: 'Do Nothing',
      reset: 'Reset Form',
    },
    inspector: 'select',
    label: 'Action',
  });

  const [icon] = Numi.useStateJsonSchema({
    name: 'icon',
    label: 'Icon',
    defaultValue: { icon: null,  emoji: null, url: null } as IconValue,
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      meta: { editor: "iconSelector" },
    },
  });

  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {}, 'expand'),
    Style.dimensions('iconSize', 'Icon Size', {
      config: {
        hideWidth: true
      }
    }, {height: '16px'}),
    Style.backgroundColor('iconColor', 'Icon Color', {}, theme?.primary_contrast_color),
    Style.backgroundColor('backgroundColor', 'Button Color', {
      supportsGradients: true,
    }, theme?.primary_color),
    Style.font('font', 'Button Font & Color',
      {
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        },
      },
      {
          color: theme?.primary_contrast_color,
      },
    ),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, theme?.border_radius),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, theme?.shadow),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const font = {
    ...resolveThemeValue(style?.font, theme, 'body_typography') as FontValue,
    color: resolveThemeValue(style?.font?.color, theme, 'primary_contrast_color'),
  } as FontValue;

  const border = style?.border as BorderValue;

  const { executeCallbacks } = Numi.useEventCallback({
    name: 'click',
    elements: [
      {
        value: text,
        label: text,
      },
    ],
    events: [{
      label: EVENT_LABEL_MAP[Event.onClick],
      events: [Event.onClick],
    }],
  });

  const containerStyles = useMemo(() => ({
    margin: appearance.margin,
  }), [appearance, theme]);

  const resolvedBackgroundColor = resolveThemeValue(style.backgroundColor, theme, 'primary_color') as string;
  const resolvedColor = resolveThemeValue(font.color, theme, 'primary_contrast_color') as string;
  const resolvedBorderColor = resolveThemeValue(style.borderColor, theme) as string;
  const resolvedBorderRadius = resolveThemeValue(style?.borderRadius, theme, 'border_radius') as string;
  const resolvedShadow = resolveThemeValue(style?.shadow, theme, 'shadow') as string;
  
  // Check if the background is a gradient
  const isGradient = typeof resolvedBackgroundColor === 'string' && 
    (resolvedBackgroundColor.includes('linear-gradient') || resolvedBackgroundColor.includes('radial-gradient'));

  const buttonStyles = useMemo(() => ({
    // Use 'background' for gradients, 'backgroundColor' for solid colors
    ...(isGradient ? { background: resolvedBackgroundColor } : { backgroundColor: resolvedBackgroundColor }),
    color: resolvedColor,
    fontFamily: font?.font,
    fontWeight: font?.weight,
    fontSize: font?.size,
    lineHeight: font?.lineHeight,
    letterSpacing: font?.letterSpacing,
    borderColor: resolvedBorderColor,
    borderWidth: border?.width,
    borderStyle: border?.style,
    borderRadius: resolvedBorderRadius,
    boxShadow: resolvedShadow,
    padding: appearance.padding,
    gap: appearance.spacing,
  }), [resolvedBackgroundColor, resolvedColor, resolvedBorderColor, resolvedBorderRadius, resolvedShadow, font, border, appearance, isGradient]);

  const buttonClasses = useMemo(() => cx({
    "flex flex-row gap-x-2 items-center text-center": true,
    // Remove border class for gradients to avoid interference
    "border border-gray-300 rounded-md p-2": !isGradient,
    "rounded-md p-2": isGradient, // Keep padding and border radius for gradients
    "hover:cursor-pointer": !isSubmitting,
    // Use different hover effects for gradients vs solid colors
    "hover:brightness-90 active:brightness-85": !isSubmitting && !isGradient,
    "hover:opacity-90 active:opacity-80": !isSubmitting && isGradient,
    "w-full justify-center": style.alignment === 'expand',
    "w-fit": style.alignment !== 'expand',
    "opacity-50 cursor-not-allowed": isSubmitting,
    "border-none": style.border === 'none',
    "border-[1px]": style.border === 'xs' && !isGradient,
    "border-[4px]": style.border === 'sm' && !isGradient,
    "border-[8px]": style.border === 'md' && !isGradient,
    "border-[12px]": style.border === 'lg' && !isGradient,
    "border-[16px]": style.border === 'xl' && !isGradient,
  }), [style.alignment, style.fontWeight, style.border, isSubmitting, isGradient]);

  const containerClasses = useMemo(() => cn("space-y-2 flex flex-col", {
    "items-start": style.alignment === 'left',
    "items-center": style.alignment === 'center',
    "items-end": style.alignment === 'right',
    "justify-stretch": style.alignment === 'expand',
  }), [style.alignment]);

  const iconStyles = useMemo(() => ({
    size: style?.iconSize?.height,
    color: resolveThemeValue(style.iconColor, theme, 'primary_contrast_color') as string,
  }), [style]);

  if (style.hidden) {
    return null;
  }

  return (
    <div className={containerClasses} style={containerStyles}>
      {type === 'submit' && submitError && (
        <div className="text-sm text-red-600">
          {submitError}
        </div>
      )}
      <button
        type={type}
        disabled={type === 'submit' && isSubmitting}
        className={buttonClasses}
        style={buttonStyles}
        onClick={() => executeCallbacks(Event.onClick)}
      >
        <IconRenderer icon={icon} style={iconStyles} defaultIcon={''}/>
        {type === 'submit' && isSubmitting ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Processing...</span>
          </div>
        ) : (
          text
        )}
      </button>
    </div>
  );
}

export default ButtonBlockComponent;
