import { BlockContextType } from "@/types/blocks";
import Numi, { Appearance, Style } from "@/contexts/Numi";
import { useMemo } from "react";
import { resolveThemeValue } from "@/lib/theme";

function DividerBlockComponent({ context }: { context: BlockContextType }) {

  const theme = Numi.useTheme();

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}, '0px'),
    Appearance.margin('margin', 'Margin', {}, '0px'),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const style = Numi.useStyle([
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),
    Style.border('border', 'Border', {}, {}),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '0px'),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, ''),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const dividerStyles = useMemo(() => ({
    backgroundColor: resolveThemeValue(style.backgroundColor, theme, 'primary_border_color'),
    borderColor: resolveThemeValue(style.borderColor, theme),
    ...style.border ? {
      borderWidth: style?.border?.width,
      borderStyle: style?.border?.style,
    } : {},
    borderRadius: style?.borderRadius ?? '3px',
    boxShadow: style?.shadow,
    padding: appearance.padding,
    margin: appearance.margin,
  }), [style, appearance]);

  if (style.hidden) {
    return null;
  }

  return (
    <div className="w-full">
      <hr style={dividerStyles} />
    </div>
  );
}

export default DividerBlockComponent;
