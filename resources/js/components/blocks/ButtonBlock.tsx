import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance, BorderValue, FontValue, IconValue, Style } from '@/contexts/Numi';
import cx from "classnames";
import { useCheckoutState } from "@/pages/checkout-main";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { IconRenderer } from "../ui/icon-renderer";

// Does Submitting of field forms.
function ButtonBlockComponent({ context }: { context: BlockContextType }) {
  const { isSubmitting, submitError } = useCheckoutState();

  // console.log({ isSubmitting, submitError });

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
      submit: 'Submit',
      button: 'Button',
      reset: 'Reset',
    },
    inspector: 'select',
    label: 'Type',
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

  const theme = Numi.useTheme();
  console.log({ theme })


  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {}, 'expand'),
    Style.dimensions('iconSize', 'Icon Size', {
      config: {
        hideWidth: true
      }
    }, {height: '16px'}),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, theme?.primary_color),
    Style.font('font', 'Button Font & Color',
      {
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        },
      },
      {
        color: theme?.label_typography?.color,
        font: theme?.label_typography?.font,
        weight: theme?.label_typography?.weight,
        size: theme?.label_typography?.size,
        lineHeight: theme?.label_typography?.lineHeight ?? '1.5',
        letterSpacing: theme?.label_typography?.letterSpacing ?? '0px',
      },
    ),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Radius', {}, theme?.border_radius),
    Style.borderColor('borderColor', 'Border Color', {}, '#000000'),
    Style.shadow('shadow', 'Shadow', {}, '0px 0px 0px 0px #000000'),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const appearance = Numi.useAppearance([
    Appearance.padding('Padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
    Appearance.alignment('alignment', 'Alignment', {}, 'left'),
  ]);

  const font = style?.font as FontValue;
  const border = style?.border as BorderValue;
  const borderRadius = style?.borderRadius;
  const shadow = style?.shadow as string;

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


  const buttonStyles = useMemo(() => ({
    backgroundColor: style.backgroundColor,
    color: font?.color,
    fontFamily: font?.font || theme?.body_typography?.font,
    fontWeight: font?.weight || theme?.body_typography?.weight,
    fontSize: font?.size || theme?.body_typography?.size,
    lineHeight: font?.lineHeight,
    letterSpacing: font?.letterSpacing,
    borderColor: style.borderColor,
    borderWidth: border?.width,
    borderStyle: border?.style,
    borderRadius : borderRadius,
    boxShadow: shadow,
    padding: appearance?.padding ?? theme.padding,
    margin: appearance?.margin,
  }), [style, font, border, borderRadius, shadow, appearance]);

  console.log({ buttonStyles })

  const buttonClasses = useMemo(() => cx({
    "flex flex-row gap-x-2 items-center text-center": true,
    "border border-gray-300 rounded-md p-2": true,
    "hover:cursor-pointer hover:brightness-90 active:brightness-85": !isSubmitting,
    "w-full justify-center": style.alignment === 'expand',
    "opacity-50 cursor-not-allowed": isSubmitting,
    "border-none": style.border === 'none',
    "border-[1px]": style.border === 'xs',
    "border-[4px]": style.border === 'sm',
    "border-[8px]": style.border === 'md',
    "border-[12px]": style.border === 'lg',
    "border-[16px]": style.border === 'xl',
  }), [style.alignment, style.fontWeight, style.border, isSubmitting]);

  const containerClasses = useMemo(() => cn("space-y-2 flex", {
    "justify-start": style.alignment === 'left',
    "justify-center": style.alignment === 'center',
    "justify-end": style.alignment === 'right',
    "justify-stretch": style.alignment === 'expand',
  }), [style.alignment]);

  const iconStyles = useMemo(() => ({
    size: style?.iconSize?.height ?? '16px',
    color: style?.iconColor ?? 'black',
  }), [style]);

  if (style.hidden) {
    return null;
  }

  return (
    <div className={containerClasses}>
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
      {type === 'submit' && submitError && (
        <div className="text-sm text-red-600">
          {submitError}
        </div>
      )}
    </div>
  );
}

export default ButtonBlockComponent;
