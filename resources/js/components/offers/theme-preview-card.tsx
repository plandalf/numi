import React from 'react';
import { Theme } from '@/types/theme';
import { CheckIcon } from 'lucide-react';
import { cx } from 'class-variance-authority';

interface ThemePreviewCardProps {
  theme: Theme;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const ThemePreviewCard: React.FC<ThemePreviewCardProps> = ({ theme, className, selected, onClick }) => {
  const primary = theme.primary_color || '#18181b'; // Default dark gray for primary
  const primaryContrast = theme.primary_contrast_color || '#18181b'; // Default white for primary contrast
  const secondary = theme.secondary_color || '#52525d'; // Default medium gray for secondary
  const canvas = theme.canvas_color || '#ffffff'; // Default white for canvas
  const surface = theme.primary_surface_color || '#f4f4f5'; // Default light gray for surface
  const borderRadius   = '8px'; // Default border radius

  return (
    <div
      className={cx(
        'cursor-pointer overflow-hidden rounded-lg border shadow-sm hover:shadow-md transition-shadow duration-200 bg-white',
        className,
        selected && 'border-2 border-green-500'
      )}
      style={{
        borderRadius: theme.border_radius || borderRadius,
      }}
      onClick={onClick}
    >
      <div className="p-4">
        <h3 className="flex flex-row text-lg font-semibold mb-3 justify-between" >
          {theme.name || 'Untitled Theme'}
          {selected &&
            <span className="flex flex-row items-center gap-1 text-xs  text-green-500 rounded-md px-2 py-1 bg-green-500/10">
              <CheckIcon className="w-4 h-4" />Selected
            </span>
          }
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
