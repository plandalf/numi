import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance, FontValue, IconValue, Style } from "@/contexts/Numi";
import { useEffect, useMemo, useRef, useState } from "react";
import { resolveThemeValue } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { IconRenderer } from "../ui/icon-renderer";

function formatTime(msRemaining: number) {
  const clamped = Math.max(0, msRemaining);
  const totalSeconds = Math.floor(clamped / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function CountdownBlock({ context }: { context: BlockContextType }) {
  const theme = Numi.useTheme();
  const { session, isEditor } = Numi.useCheckout();

  const [label] = Numi.useStateString({
    label: "Label",
    name: "label",
    defaultValue: "Limited Offer Ends:",
  });

  const [durationHours] = Numi.useStateNumber({
    name: "durationHours",
    label: "Duration (hours)",
    defaultValue: 48,
    min: 1,
    max: 240,
    inspector: "slider",
  });

  const [hideWhenExpired] = Numi.useStateBoolean({
    name: "hideWhenExpired",
    label: "Hide when expired",
    defaultValue: false,
    inspector: "checkbox",
  });

  const [icon] = Numi.useStateJsonSchema({
    name: "icon",
    label: "Icon",
    defaultValue: { icon: "AlarmClock", emoji: null, url: null } as IconValue,
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      meta: { editor: "iconSelector" },
    },
  });

  const appearance = Numi.useAppearance([
    Appearance.padding("padding", "Padding", {}),
    Appearance.margin("margin", "Margin", {}),
    Appearance.spacing("spacing", "Spacing", { config: { format: "single" } }),
    Appearance.visibility("visibility", "Visibility", {}, { conditional: [] }),
  ]);

  const style = Numi.useStyle([
    Style.alignment("alignment", "Alignment", {}, "left"),
    Style.backgroundColor("backgroundColor", "Background Color", {}, ""),
    Style.font(
      "labelFont",
      "Label Font & Color",
      { config: { hideVerticalAlignment: true, hideHorizontalAlignment: true } },
      theme?.label_typography as FontValue
    ),
    Style.font(
      "timerFont",
      "Timer Font & Color",
      { config: { hideVerticalAlignment: true, hideHorizontalAlignment: true } },
      theme?.label_typography as FontValue
    ),
    Style.backgroundColor(
      "timerBackgroundColor",
      "Timer Background Color",
      {},
      theme?.badge_background_color ?? theme?.secondary_surface_color
    ),
    Style.border("border", "Border", {}, { width: "0px", style: "solid" }),
    Style.borderRadius("borderRadius", "Border Radius", {}, theme?.border_radius),
    Style.shadow("shadow", "Shadow", {}, 'none'),
    Style.backgroundColor("iconColor", "Icon Color", {}, theme?.primary_color),
    Style.dimensions("iconSize", "Icon Size", { config: { hideWidth: true } }, { height: "18px" }),
    Style.hidden("hidden", "Hidden", {}, false),
  ]);

  const containerClasses = useMemo(
    () =>
      cn("flex items-center", {
        "justify-start": style.alignment === "left",
        "justify-center": style.alignment === "center",
        "justify-end": style.alignment === "right",
        "justify-stretch": style.alignment === "expand",
      }),
    [style.alignment]
  );

  const containerStyle = useMemo(() => {
    return {
      backgroundColor: resolveThemeValue(style.backgroundColor, theme) as string,
      padding: appearance.padding,
      margin: appearance.margin,
      gap: appearance.spacing,
      boxShadow: style?.shadow,
      borderRadius: style?.borderRadius ?? "3px",
    } as React.CSSProperties;
  }, [appearance.padding, appearance.margin, appearance.spacing, style, theme]);

  const labelStyle = useMemo(() => {
    return {
      color: resolveThemeValue(style.labelFont?.color, theme),
      fontFamily: style?.labelFont?.font,
      fontWeight: style?.labelFont?.weight,
      fontSize: style?.labelFont?.size,
      lineHeight: style?.labelFont?.lineHeight,
      letterSpacing: style?.labelFont?.letterSpacing,
    } as React.CSSProperties;
  }, [style?.labelFont, theme]);

  const iconStyle = useMemo(
    () => ({
      size: style?.iconSize?.height ?? "18px",
      color: resolveThemeValue(style?.iconColor, theme) as string,
    }),
    [style?.iconColor, style?.iconSize, theme]
  );

  const timerStyle = useMemo(() => {
    const timerFont = style?.timerFont as FontValue;
    return {
      backgroundColor: resolveThemeValue(style.timerBackgroundColor, theme, "secondary_surface_color") as string,
      color: resolveThemeValue(timerFont?.color, theme, "primary_color"),
      fontFamily: timerFont?.font,
      fontWeight: timerFont?.weight,
      fontSize: timerFont?.size,
      lineHeight: timerFont?.lineHeight,
      letterSpacing: timerFont?.letterSpacing,
      padding: "4px 8px",
      borderRadius: "6px",
    } as React.CSSProperties;
  }, [style.timerBackgroundColor, style.timerFont, theme]);

  const [now, setNow] = useState<number>(() => Date.now());
  const intervalRef = useRef<number | null>(null);

  const createdAt = useMemo(() => {
    // Fallback to current time in editor if not present
    const value = (session as any)?.created_at as string | undefined;
    return value ? new Date(value).getTime() : Date.now();
  }, [session?.id, (session as any)?.created_at]);

  const targetTime = useMemo(() => {
    const hoursMs = (Number(durationHours) || 0) * 60 * 60 * 1000;
    return createdAt + hoursMs;
  }, [createdAt, durationHours]);

  const msRemaining = Math.max(0, targetTime - now);
  const isExpired = msRemaining <= 0;

  useEffect(() => {
    // Refresh each second
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [targetTime]);

  if (style.hidden) return null;
  if (hideWhenExpired && isExpired) return null;

  return (
    <div className={containerClasses} style={containerStyle} id={context.blockId}>
      <div className="flex items-center gap-2">
        <IconRenderer icon={icon} style={iconStyle} defaultIcon={null} />
        {label && <span style={labelStyle}>{label}</span>}
        <span style={timerStyle} className="font-mono tabular-nums">
          {formatTime(msRemaining)}
        </span>
      </div>
    </div>
  );
}

export default CountdownBlock;


