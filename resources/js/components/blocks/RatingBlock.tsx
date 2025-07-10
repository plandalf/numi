import Numi, { Style, BorderValue, Appearance } from "@/contexts/Numi";
import { useMemo } from "react";
import { Star } from "lucide-react";
import { resolveThemeValue } from "@/lib/theme";
import { MarkdownText } from "../ui/markdown-text";

function RatingBlockComponent() {
  const theme = Numi.useTheme();

  const [label] = Numi.useStateString({
    label: 'Label',
    name: 'label',
    defaultValue: 'Rate this:',
    inspector: 'multiline',
    format: 'markdown',
  });

  const [rating] = Numi.useStateNumber({
    label: 'Rating',
    name: 'value',
    defaultValue: 0,
    min: 0,
    max: 5,
  });

  const appearance = Numi.useAppearance([
    Appearance.margin('margin', 'Margin', {}),
    Appearance.padding('padding', 'Padding', {}, '0px'),
    Appearance.spacing('spacing', 'Spacing', { config: { format: 'single' } }),
    Appearance.visibility('visibility', 'Visibility', {}, { conditional: [] }),
  ]);

  const style = Numi.useStyle([
    Style.backgroundColor('backgroundColor', 'Background Color', {}, ''),
    Style.textColor('starColor', 'Star Color', {}, '#FFD700'),
    Style.textColor('emptyStarColor', 'Empty Star Color', {}, '#E5E7EB'),
    Style.font('font', 'Label Font & Color',
      {
        config: {
          hideVerticalAlignment: true,
          hideHorizontalAlignment: true,
        },
      },
      {},
    ),
    Style.border('border', 'Border', {}, { width: '0px', style: 'solid' }),
    Style.borderRadius('borderRadius', 'Border Radius', {}, '5px'),
    Style.borderColor('borderColor', 'Border Color', {}, ''),
    Style.shadow('shadow', 'Shadow', {}, ''),
    Style.hidden('hidden', 'Hidden', {}, false),
  ]);

  const font = style.font;
  const border = style?.border as BorderValue;
  const borderColor = resolveThemeValue(style?.borderColor, theme);
  const starColor = resolveThemeValue(style?.starColor, theme) || '#FFD700';
  const emptyStarColor = resolveThemeValue(style?.emptyStarColor, theme) || '#E5E7EB';
  const backgroundColor = resolveThemeValue(style?.backgroundColor, theme);
  const borderRadius = style?.borderRadius;
  const shadow = style?.shadow as string;

  const containerStyles = useMemo(() => ({
    padding: appearance.padding,
    margin: appearance.margin,
    gap: appearance.spacing,
    backgroundColor: backgroundColor as string,
    borderColor: borderColor as string,
    borderWidth: border?.width,
    borderStyle: border?.style,
    borderRadius,
    boxShadow: shadow,
  }), [appearance, backgroundColor, border, borderRadius, shadow, borderColor]);

  const labelStyles = useMemo(() => ({
    color: resolveThemeValue(font?.color, theme) as string,
    fontFamily: font?.font,
    fontWeight: font?.weight,
    fontSize: font?.size,
    lineHeight: font?.lineHeight,
    letterSpacing: font?.letterSpacing,
  }), [font, theme]);

  const starStyles = useMemo(() => ({
    cursor: 'pointer',
    transition: 'transform 0.1s ease-in-out',
  }), []);

  const filledStarStyles = useMemo(() => ({
    ...starStyles,
    color: starColor as string,
  }), [starStyles, starColor]);

  const emptyStarStyles = useMemo(() => ({
    ...starStyles,
    color: emptyStarColor as string,
  }), [starStyles, emptyStarColor]);

  // Round rating to nearest 0.5
  const roundedRating = Math.round((rating ?? 0) * 2) / 2;

  if (style.hidden) {
    return null;
  }

  const labelComponent = (
    label && <MarkdownText text={label} theme={theme} style={labelStyles} />
  );

  const renderStars = () => {
    const stars = [];
    const maxStars = 5;
    for (let i = 1; i <= maxStars; i++) {
      let starType: 'full' | 'half' | 'empty' = 'empty';
      if (roundedRating >= i) {
        starType = 'full';
      } else if (roundedRating >= i - 0.5) {
        starType = 'half';
      }
      if (starType === 'full') {
        stars.push(
          <div key={i} style={filledStarStyles} className="hover:scale-110">
            <Star
              size={24}
              fill={starColor as string}
              stroke={starColor as string}
              strokeWidth={1.5}
            />
          </div>
        );
      } else if (starType === 'half') {
        stars.push(
          <div key={i} style={filledStarStyles} className="hover:scale-110 relative">
            <svg width={24} height={24} viewBox="0 0 24 24" className="absolute top-0 left-0" style={{zIndex: 1}}>
              <defs>
                <linearGradient id={`half-star-${i}`} x1="0" x2="1" y1="0" y2="0">
                  <stop offset="50%" stopColor={starColor as string} />
                  <stop offset="50%" stopColor="#fff" />
                </linearGradient>
              </defs>
              <Star
                size={24}
                fill={`url(#half-star-${i})`}
                stroke={starColor as string}
                strokeWidth={1.5}
              />
            </svg>
            <Star
              size={24}
              fill="none"
              stroke={emptyStarColor as string}
              strokeWidth={1.5}
              style={{ visibility: 'hidden' }}
            />
          </div>
        );
      } else {
        stars.push(
          <div key={i} style={emptyStarStyles} className="hover:scale-110">
            <Star
              size={24}
              fill="none"
              stroke={emptyStarColor as string}
              strokeWidth={1.5}
            />
          </div>
        );
      }
    }
    return stars;
  };

  return (
    <div className="flex flex-col gap-2" style={containerStyles}>
      {labelComponent}
      <div className="flex items-center gap-1">
        {renderStars()}
      </div>
    </div>
  );
}

export default RatingBlockComponent;
