import React from 'react';
import { Slider } from './slider';
import { cn } from '@/lib/utils';
import { Separator } from './separator';
import { AdvancedColorPicker } from './color-picker-advanced';

export interface ColorPickerProps {
  value: string; // #RRGGBB or #RRGGBBAA
  onChange: (hexWithAlpha: string) => void;
  onBlur?: () => void;
  className?: string;
  type?: 'simple' | 'advanced';
  themeColors?: Record<string, string>;
  trigger?: React.ReactNode;
}

// Utility: parse hex to {rgb, alpha}
export function parseHexAlpha(hex: string) {
  let rgb = hex.slice(0, 7);
  let alpha = 255;
  if (hex.length === 9) {
    alpha = parseInt(hex.slice(7, 9), 16);
  }
  return { rgb, alpha };
}

// Utility: combine rgb and alpha to hex
function combineHexAlpha(rgb: string, alpha: number) {
  const a = Math.round(alpha).toString(16).padStart(2, '0').toUpperCase();
  return rgb + a;
}

export const ColorPicker: React.FC<ColorPickerProps> = (props) => {
  if (props.type === 'advanced') {
    return <AdvancedColorPicker {...props} />;
  }
  const { value, onChange, className, type = 'simple' } = props;
  const { rgb, alpha } = parseHexAlpha(value);
  const percent = Math.round((alpha / 255) * 100);

  return (
    <div className={cn('flex items-center gap-2 border border-gray-300/50 rounded-md px-2 py-1 relative', className)}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={rgb}
          onChange={e => onChange(combineHexAlpha(e.target.value, alpha))}
          onBlur={props.onBlur}
          className="w-8 h-8 rounded-xl cursor-pointer border-none"
        />
        <span className="flex-1 uppercase text-xs w-14 text-left">{rgb.toUpperCase()}</span>
      </div>
      <Separator orientation="vertical" className="bg-gray-300/50 !h-8" />
      <div className="flex-1 min-w-[100px]">
        <Slider
          min={0}
          max={100}
          step={1}
          value={[percent]}
          onValueChange={([val]) => onChange(combineHexAlpha(rgb, Math.round((val / 100) * 255)))}
        />
      </div>
      <Separator orientation="vertical" className="bg-gray-300/50 !h-8" />
      <span className="w-10 text-xs text-left">{percent}%</span>
    </div>
  );
};

export { AdvancedColorPicker }; 