import React from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Label } from './label';
import { Slider } from './slider';

interface RangeSliderProps {
  children: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  formatValue?: (value: number) => string;
  side?: 'left' | 'right' | 'top' | 'bottom';
  align?: 'start' | 'center' | 'end';
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  children,
  value,
  onChange,
  min = 0,
  max = 50,
  step = 1,
  label = 'Value',
  formatValue = (val) => `${val}px`,
  side = 'right',
  align = 'center',
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-50 p-4" side={side} align={align}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{label}</Label>
            <span className="text-sm text-muted-foreground">{formatValue(value)}</span>
          </div>
          <Slider
            value={[value]}
            onValueChange={(values) => onChange(values[0])}
            max={max}
            min={min}
            step={step}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}; 