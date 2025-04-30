import React from 'react';
import { Theme } from '@/types/theme';

interface ThemePreviewCardProps {
  theme: Theme;
  onClick?: () => void;
  className?: string;
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({ theme, className, onClick }) => {
  // Fallbacks for missing theme fields
  const primary = theme.primary_color || '#000';
  const surface = theme.primary_surface_color || '#fff';
  const border = theme.primary_border_color || '#e5e7eb';
  const text = theme.dark_text_color || '#222';
  const radius = theme.border_radius || '12px';
  const shadow = theme.shadow_md || '0 4px 6px -1px rgba(0,0,0,0.1)';
  const font = (Array.isArray(theme.body_typography) ? theme.body_typography[1] : theme.body_typography) || 'Inter';
  const fontSize = (Array.isArray(theme.body_typography) ? theme.body_typography[0] : '16px') || '16px';
  const fontWeight = (Array.isArray(theme.body_typography) ? theme.body_typography[2] : '400') || '400';

  return (
    <div
      className={`cursor-pointer overflow-hidden shadow border mb-2 ${className || ''}`}
      style={{
        background: primary,
        borderColor: border,
        borderRadius: radius,
        boxShadow: shadow,
      }}
      onClick={onClick}
    >
      <div
        className="px-4 py-2 font-semibold"
        style={{
          color: theme.light_text_color || '#fff',
          fontFamily: font,
          fontSize: '1rem',
        }}
      >
        {theme.name || 'Untitled theme'}
      </div>
      <div
        className="p-4"
        style={{
          background: surface,
          borderRadius: `0 0 ${radius} ${radius}`,
        }}
      >
        <div
          className="px-4 py-2"
          style={{
            background: '#fff',
            color: text,
            fontFamily: font,
            fontSize,
            fontWeight,
            borderRadius: '8px',
            boxShadow: theme.shadow_sm || '0 1px 2px 0 rgba(0,0,0,0.05)',
            border: `1px solid ${border}`,
            display: 'inline-block',
          }}
        >
          Text
        </div>
      </div>
    </div>
  );
};

export default ThemePreviewCard; 