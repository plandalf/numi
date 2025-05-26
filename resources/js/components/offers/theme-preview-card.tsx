import React from 'react';
import { Theme } from '@/types/theme';

interface ThemePreviewCardProps {
  theme: Theme;
  onClick?: () => void;
  className?: string;
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({ theme, className, onClick }) => {
  const primary = theme.primary_color || '#18181b'; // Default dark gray for primary
  const secondary = theme.secondary_color || '#52525d'; // Default medium gray for secondary
  const canvas = theme.canvas_color || '#ffffff'; // Default white for canvas
  const surface = theme.primary_surface_color || '#f4f4f5'; // Default light gray for surface
  const defaultBorderRadius = '8px'; // Default border radius

  return (
    <div
      className={`cursor-pointer overflow-hidden rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 bg-white ${className || ''}`}
      style={{
        borderRadius: theme.border_radius || defaultBorderRadius,
      }}
      onClick={onClick}
    >
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-3" style={{ color: theme.light_text_color || '#18181b' }}>
          {theme.name || 'Untitled Theme'}
        </h3>
        <div className="flex space-x-2">
          {[primary, secondary, canvas, surface].map((color, index) => (
            <div
              key={index}
              className="h-8 w-8 rounded-md border"
              style={{ 
                backgroundColor: color,
                borderRadius: '6px', // Slightly smaller radius for swatches
              }}
              title={['Primary', 'Secondary', 'Canvas', 'Surface'][index] + ': ' + color}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemePreviewCard;
