import { IconValue } from "@/contexts/Numi";
import { memo } from "react";
import * as LucideIcons from "lucide-react";

export interface IconRendererProp {
  defaultIcon?: React.ReactNode;
  icon: IconValue;
  style: {
    alignSelf?: string;
    size?: string;
    width?: string;
    height?: string;
    color?: string;
    shadow?: string;
  }
}

export const IconRenderer = memo(({ defaultIcon, icon, style }: IconRendererProp) => {

  if(icon?.icon) {
    const Component = LucideIcons[icon.icon as keyof typeof LucideIcons] as import('lucide-react').LucideIcon;

    return (
      <Component
        style={{
          alignSelf: style?.alignSelf,
          width: style?.width ?? style?.size ?? '42px',
          height: style?.height ?? style?.size ?? '42px',
          color: style?.color ?? 'black',
          boxShadow: style?.shadow ?? 'none',
        }}
      />
    )
  }

  if(icon?.emoji) {
    return (
      <span
        style={{
          alignSelf: style?.alignSelf,
          fontSize: style?.size ?? '22px',
          color: style?.color ?? 'black',
          width: style?.width ?? style?.size ?? '22px',
          height: style?.height ?? style?.size ?? '22px',
          lineHeight: '1',
          boxShadow: style?.shadow ?? 'none',
        }}>
          {icon.emoji}
      </span>
    )
  }
  if(icon?.url) {
    return (
      <img
        src={icon.url}
        style={{
          alignSelf: style?.alignSelf,
          width: style?.width ?? style?.size ?? '22px',
          height: style?.height ?? style?.size ?? '22px',
          boxShadow: style?.shadow ?? 'none',
        }}
      />
    )
  }

  return (defaultIcon ?? null);
});