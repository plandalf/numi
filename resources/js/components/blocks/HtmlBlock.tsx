import Numi, { Appearance, Style } from "@/contexts/Numi";
import { useMemo, type CSSProperties } from "react";
import { resolveThemeValue } from "@/lib/theme";

function HtmlBlockComponent() {
  const theme = Numi.useTheme();

  const [htmlContent] = Numi.useStateString({
    label: 'HTML Content',
    name: 'htmlContent',
    defaultValue: '<p>Enter your HTML content here</p>',
    inspector: 'code',
  });

  const appearance = Numi.useAppearance([
    Appearance.padding('padding', 'Padding', {}),
    Appearance.margin('margin', 'Margin', {}),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const style = Numi.useStyle([
    Style.alignment('alignment', 'Alignment', {}, 'left'),
    Style.backgroundColor('backgroundColor', 'Background Color', {}, 'transparent'),
    Style.border('border', 'Border', {}, { width: '0px', style: 'none' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, theme?.border_radius),
    Style.borderColor('borderColor', 'Border Color', {}, theme?.primary_border_color),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const htmlStyles = useMemo(() => ({
    padding: (appearance.padding ?? '') as CSSProperties['padding'],
    width: style.alignment == 'expand' ? '100%' : 'auto',
    backgroundColor: resolveThemeValue(style.backgroundColor, theme) as string,
    borderColor: resolveThemeValue(style.borderColor, theme) as string,
    borderWidth: style.border?.width ?? '0px',
    borderStyle: style.border?.style,
    borderRadius : style.borderRadius,
  }) as CSSProperties, [style, appearance, theme]);

  return (
    <div 
      className="html-content"
      style={htmlStyles}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export default HtmlBlockComponent; 