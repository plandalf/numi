import React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from './separator';
import { Font } from '@/types';
import { Label } from './label';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { WEIGHT_LABELS } from './font-picker';

export interface TypographyPickerConfig {
  hideLabel?: boolean;
}

interface TypographyPickerProps {
  value: string[];
  onChange: (value: string[]) => void;
  onClose?: () => void;
  config?: TypographyPickerConfig;
  className?: string;
  fonts: Font[];
}

export const TypographyPicker: React.FC<TypographyPickerProps> = ({
  value,
  onChange,
  onClose,
  config,
  className,
  fonts,
}) => {
  const { hideLabel } = config || {};

  const [size = '', font = '', weight = '', color = ''] = value || [];
  
  const selectedFont = fonts.find(f => f.name === font);
  const availableWeights = selectedFont?.weights || [];

  const handleFontChange = (newFont: string) => {
    const newSelectedFont = fonts.find(f => f.name === newFont);
    const newAvailableWeights = newSelectedFont?.weights || [];
    
    // If current weight is not in the new font's weights, default to Regular (400)
    const newWeight = newAvailableWeights.includes(weight) ? weight : '400';
    onChange([size, newFont, newWeight]);
  };

  return (
    <div className={cn("py-4 px-2.5 flex flex-col items-center gap-2 w-full", className)}>
      {!hideLabel && (
        <>
          <div className="flex items-center justify-between gap-2 w-full">
            <Label className="text-start">Font</Label>
            {onClose && (
              <X className="size-4 cursor-pointer" onClick={onClose} />
            )} 
          </div>
          <Separator className="my-2"/>
        </>
      )}
      <div className="flex gap-2">
        <Input
          value={size}
          onChange={e => onChange([e.target.value, font, weight])}
          placeholder="Size (e.g. 16px)"
          className="min-w-[50px] text-xs truncate"
        />
        <Select value={font} onValueChange={handleFontChange}>
          <SelectTrigger className="min-w-[100px] text-xs truncate" style={{ fontFamily: font }}>
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map(f => (
              <SelectItem className="text-xs truncate" key={f.name} value={f.name} style={{ fontFamily: f.name }}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select 
          value={weight} 
          onValueChange={w => onChange([size, font, w])}
          disabled={!selectedFont}
        >
          <SelectTrigger className="min-w-[100px] text-xs truncate">
            <SelectValue placeholder="Weight" />
          </SelectTrigger>
          <SelectContent>
            {availableWeights.map(w => (
              <SelectItem className="text-xs truncate" key={w} value={w}>
                {WEIGHT_LABELS[w] || w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}; 