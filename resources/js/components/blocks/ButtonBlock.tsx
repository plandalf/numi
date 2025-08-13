// import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance, BorderValue, FontValue, IconValue, Style } from '@/contexts/Numi';
import cx from "classnames";
import { useCheckoutState } from "@/pages/checkout-main";
import { cn } from "@/lib/utils";
import { useMemo, type CSSProperties } from "react";
import { Event, EVENT_LABEL_MAP } from "../editor/interaction-event-editor";
import { IconRenderer } from "../ui/icon-renderer";
import { resolveThemeValue } from "@/lib/theme";

// Does Submitting of field forms.
function ButtonBlockComponent() {
  const { isSubmitting, submitError } = useCheckoutState() as import("@/pages/checkout-main").GlobalState;

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

  const [isDisabled] = Numi.useStateBoolean({
    name: 'disabled',
    defaultValue: false,
    label: 'Disabled',
    inspector: 'checkbox',
    group: 'Behavior',
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
    Style.backgroundColor('backgroundColor', 'Button Color', {}, theme?.primary_color),
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
    // Default to 7px padding on all sides
    Appearance.padding('padding', 'Padding', {}, '7px'),
    Appearance.margin('margin', 'Margin', {}),
    // Default icon/content spacing ~ 0.5rem
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }, '0.5rem'),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const font = useMemo(() => ({
    ...resolveThemeValue(style?.font, theme, 'body_typography') as FontValue,
    color: resolveThemeValue(style?.font?.color, theme, 'primary_contrast_color'),
  }) as FontValue, [style?.font, theme]);

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
  }), [appearance]);

  const resolvedBackgroundColor = resolveThemeValue(style.backgroundColor, theme, 'primary_color') as string;
  const resolvedColor = resolveThemeValue(font.color, theme, 'primary_contrast_color') as string;
  const resolvedBorderColor = resolveThemeValue(style.borderColor, theme) as string;
  const resolvedBorderRadius = resolveThemeValue(style?.borderRadius, theme, 'border_radius') as string;
  const resolvedShadow = resolveThemeValue(style?.shadow, theme, 'shadow') as string;
  
  // Check if the background is a gradient
  const isGradient = typeof resolvedBackgroundColor === 'string' && 
    (resolvedBackgroundColor.includes('linear-gradient') || resolvedBackgroundColor.includes('radial-gradient'));

  const buttonStyles = useMemo(() => {
    const isColorWhite = (value?: string) => {
      if (!value) return true;
      const v = String(value).toLowerCase().replace(/\s+/g, '');
      return (
        v === 'white' ||
        v === '#fff' || v === '#ffffff' ||
        v.startsWith('rgb(255,255,255') ||
        v.startsWith('hsl(0,0%100%)') || v.startsWith('hsl(0,0%,100%)') ||
        v.startsWith('oklch(1')
      );
    };

    // Beautiful defaults when theme background resolves to white/transparent
    const defaultSurface = '#189AB4';
    const defaultBorder = '#007D96';
    const effectiveBg = isGradient
      ? resolvedBackgroundColor
      : (isColorWhite(resolvedBackgroundColor) ? defaultSurface : resolvedBackgroundColor);
    const effectiveBorder = isGradient
      ? 'transparent'
      : (isColorWhite(resolvedBackgroundColor) ? defaultBorder : (resolvedBorderColor || resolvedBackgroundColor));
    const effectiveText = isColorWhite(resolvedColor) && isColorWhite(resolvedBackgroundColor)
      ? '#ffffff'
      : resolvedColor;

    // Configure CSS variables used by layered button defaults
    const cssVars: Record<string, string | number | undefined> = {
      // Foreground/background layer for the button surface; supports solid or gradient
      '--btn-bg': effectiveBg as string,
      // Optical border color behind the surface; avoid visible banding for gradients
      '--btn-border': effectiveBorder as string,
      // Hover overlay tint (defaults to subtle white overlay, works on dark/light)
      '--btn-hover-overlay': 'rgb(255 255 255 / 0.08)',
      // Icon color follows text color by default
      '--btn-icon': (resolveThemeValue(style.iconColor, theme, 'primary_contrast_color') as string) || (effectiveText as string),
      // Radius token for layered rounding
      '--radius-lg': resolvedBorderRadius as string,
    };

    const styleObj: CSSProperties = {
      // Text and typography
      color: effectiveText,
      fontFamily: font?.font,
      fontWeight: font?.weight,
      fontSize: font?.size,
      lineHeight: font?.lineHeight,
      letterSpacing: font?.letterSpacing,
      // Border (author-controlled thickness/style)
      borderColor: resolvedBorderColor || effectiveBorder,
      borderWidth: border?.width,
      borderStyle: border?.style,
      // Radius and shadow
      borderRadius: resolvedBorderRadius,
      boxShadow: resolvedShadow,
      // Spacing
      padding: appearance.padding,
      gap: appearance.spacing,
      // CSS variables for Tailwind v4 arbitrary var utilities
      ...(cssVars as unknown as CSSProperties),
    };

    return styleObj;
  }, [resolvedBackgroundColor, resolvedColor, resolvedBorderColor, resolvedBorderRadius, resolvedShadow, font, border, appearance, isGradient, style.iconColor, theme]);

  const buttonClasses = useMemo(() => {
    // Beautiful layered defaults inspired by the shared Button component
    const base = [
      // Base layout and interaction
      'cursor-pointer relative isolate inline-flex items-center justify-center gap-x-2 overflow-hidden',
      'rounded-[var(--radius-lg)] border text-base/6 font-semibold whitespace-nowrap',
      'transition-[background,color,box-shadow,opacity] duration-200 ease-in-out',
      // Ensure pseudo-elements render
      "before:content-[''] after:content-['']",
      // Sizing defaults when the block has no explicit padding configured
      !appearance?.padding && 'px-[calc(theme(spacing.3.5)-1px)] py-[calc(theme(spacing.2.5)-1px)]',
      !appearance?.padding && 'sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing.1.5)-1px)] sm:text-sm/6',
      // Focus ring
      'focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500',
      // Disabled state
      'data-disabled:cursor-not-allowed data-disabled:opacity-50',
      // Icon slot defaults
      "*:data-[slot=icon]:-mx-0.5 *:data-[slot=icon]:my-0.5 *:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center *:data-[slot=icon]:text-(--btn-icon) sm:*:data-[slot=icon]:my-1 sm:*:data-[slot=icon]:size-4",
    ];

    const solidLayering = [
      // Optical border (bg behind the surface)
      'border-transparent bg-(--btn-border)',
      // Surface (foreground) on the inset before layer
      'before:absolute before:inset-0 before:-z-10 before:rounded-[calc(var(--radius-lg)-1px)] before:bg-(--btn-bg)',
      'before:opacity-90 hover:before:opacity-100 active:before:opacity-95',
      'before:shadow-sm',
      // Subtle dark outline
      'dark:border-white/5',
      // Hover/active overlay on after layer
      'after:absolute after:inset-0 after:-z-10 after:rounded-[calc(var(--radius-lg)-1px)]',
      'after:shadow-[inset_0_1px_theme(colors.white/15%)]',
      'data-active:after:bg-(--btn-hover-overlay) data-hover:after:bg-(--btn-hover-overlay)',
      'dark:after:-inset-px dark:after:rounded-lg',
      'data-disabled:before:shadow-none data-disabled:after:shadow-none',
    ];

    const alignment = [
      style.alignment === 'expand' ? 'w-full justify-center' : 'w-fit',
    ];

    const authorBorder = [
      style.border === 'none' && 'border-none',
      style.border === 'xs' && 'border-[1px]',
      style.border === 'sm' && 'border-[4px]',
      style.border === 'md' && 'border-[8px]',
      style.border === 'lg' && 'border-[12px]',
      style.border === 'xl' && 'border-[16px]',
    ];

    return cx(
      base,
      solidLayering,
      alignment,
      authorBorder,
      {
        'opacity-50 cursor-not-allowed': isSubmitting,
        'opacity-80 cursor-not-allowed': isDisabled && !isSubmitting,
      },
    );
  }, [appearance?.padding, isSubmitting, isDisabled, style.alignment, style.border]);

  const containerClasses = useMemo(() => cn("space-y-2 flex flex-col", {
    "items-start": style.alignment === 'left',
    "items-center": style.alignment === 'center',
    "items-end": style.alignment === 'right',
    "justify-stretch": style.alignment === 'expand',
  }), [style.alignment]);

  const iconStyles = useMemo(() => ({
    size: style?.iconSize?.height,
    color: resolveThemeValue(style.iconColor, theme, 'primary_contrast_color') as string,
  }), [style, theme]);

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
        disabled={(type === 'submit' && isSubmitting) || isDisabled}
        data-disabled={(isDisabled || (type === 'submit' && isSubmitting)) ? true : undefined}
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
