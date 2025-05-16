import React from 'react';
import { cn } from '@/lib/utils';
import { Grip, SunDim, X } from 'lucide-react';
import { Separator } from './separator';
import { Label } from './label';
import { RangeSlider } from './range-slider';
import { ColorPicker } from './color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export interface ShadowPickerConfig {
  hideLabel?: boolean;
}
interface ShadowPickerProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
  config?: ShadowPickerConfig;
  className?: string;
  themeColors?: Record<string, string>;
} 

export const parseShadow = (shadowValue: string) => {
  const parts = shadowValue.trim().split(' ');
  const hasInset = parts.includes('inset');
  const filteredParts = parts.filter(part => part !== 'inset');
  
  return {
    x: parseInt(filteredParts[0] ?? '0') || 0,
    y: parseInt(filteredParts[1] ?? '0') || 0,
    blur: parseInt(filteredParts[2] ?? '0') || 0,
    spread: parseInt(filteredParts[3] ?? '0') || 0,
    color: filteredParts[4] || '#000000',
    type: hasInset ? 'inner-shadow' : 'drop-shadow'
  };
};

const ShadowPicker: React.FC<ShadowPickerProps> = ({ value, onChange, onClose, className, themeColors, config }) => {
  const { hideLabel } = config || {};
  
  const shadow = parseShadow(value || '0px 0px 0px 0px #000000');

  const shadowTypeOptions = [
    { value: 'drop-shadow', label: 'Drop Shadow' },
    { value: 'inner-shadow', label: 'Inner Shadow' },
  ];

  const handleChange = (field: 'x' | 'y' | 'blur' | 'spread' | 'color' | 'type', newValue: string | number) => {
    const updatedShadow = { ...shadow, [field]: newValue };
    const shadowString = `${updatedShadow.x}px ${updatedShadow.y}px ${updatedShadow.blur}px ${updatedShadow.spread}px ${updatedShadow.color}`;
    onChange(updatedShadow.type === 'inner-shadow' ? `inset ${shadowString}` : shadowString);
  };

  return (
    <div className={cn("py-4 px-2.5 flex flex-col items-center gap-2 w-full", className)}>
      {!hideLabel && (
        <>
          <div className="flex items-center justify-between gap-2 w-full">
            <Select value={shadow.type} onValueChange={(newType) => handleChange('type', newType)}>
              <SelectTrigger title='Shadow Type' className="truncate cursor-pointer text-sm w-fit">
                <SelectValue placeholder="Select a shadow type" />
              </SelectTrigger>
              <SelectContent>
                {shadowTypeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {onClose && (
              <X className="size-4 cursor-pointer self-start" onClick={onClose} />
            )} 
          </div>
          <Separator className="my-2"/>
        </>
      )}
      <div className="flex flex-row gap-2 items-start">
        <Label className='w-[80px]'>Position</Label>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row gap-2 border border-gray-300/50 rounded-lg items-center px-2 p-1">
            <span className="text-sm px-1">X</span>
            <Separator orientation="vertical" className="bg-gray-300/50 !h-5" />
            <RangeSlider
              label="X Position"
              value={shadow.x}
              onChange={val => handleChange('x', val)}
              min={-100}
              max={100}
            >
              <input
                type="number"
                readOnly
                value={shadow.x}
                className="cursor-pointer w-27 h-6.5 text-start text-xs bg-transparent border-none text-center outline-none"
              />
            </RangeSlider>
          </div>
          <div className="flex flex-row gap-2 border border-gray-300/50 rounded-lg items-center px-2 p-1">
            <span className="text-sm px-1">Y</span>
            <Separator orientation="vertical" className="bg-gray-300/50 !h-5" />
            <RangeSlider
              label="Y Position"
              value={shadow.y}
              onChange={val => handleChange('y', val)}
              min={-100}
              max={100}
            >
              <input
                type="number"
                readOnly
                value={shadow.y}
                className="cursor-pointer w-27 h-6.5 text-start text-xs bg-transparent border-none text-center outline-none"
              />
            </RangeSlider>
          </div>
        </div>
      </div>

      <div className="flex flex-row gap-2 items-center">
        <Label className='w-[80px]'>Blur</Label>
        <div className="flex flex-row gap-2 border border-gray-300/50 rounded-lg items-center px-2 p-1">
          <SunDim className="size-4" />
          <Separator orientation="vertical" className="bg-gray-300/50 !h-5" />
          <RangeSlider
            label="Blur"
            value={shadow.blur}
            onChange={val => handleChange('blur', val)}
            min={0}
            max={100}
          >
            <input
              type="number"
              readOnly
              value={shadow.blur}
              className="cursor-pointer w-27 h-6.5 text-start text-xs bg-transparent border-none text-center outline-none"
            />
          </RangeSlider>
        </div>
      </div>

      <div className="flex flex-row gap-2 items-center">
        <Label className='w-[80px]'>Spread</Label>
        <div className="flex flex-row gap-2 border border-gray-300/50 rounded-lg items-center px-2 p-1">
          <Grip className="size-4" />
          <Separator orientation="vertical" className="bg-gray-300/50 !h-5" />
          <RangeSlider
            label="Spread"
            value={shadow.spread}
            onChange={val => handleChange('spread', val)}
            min={0}
            max={100}
          >
            <input
              type="number"
              readOnly
              value={shadow.spread}
              className="cursor-pointer w-27 h-6.5 text-start text-xs bg-transparent border-none text-center outline-none"
            />
          </RangeSlider>
        </div>
      </div>

      <div className="flex flex-row gap-2 items-center">
        <Label className='w-[80px]'>Color</Label>
        <ColorPicker
          type="advanced"
          value={shadow.color}
          onChange={val => handleChange('color', val)}
          themeColors={themeColors}
          className='gap-2 w-40'
        />
      </div>
    </div>
  );
};

export default ShadowPicker; 