import React from 'react';
import { cn } from '@/lib/utils';
import { Grip, SunDim, X } from 'lucide-react';
import { Input } from './input';

interface ShadowPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const ShadowPicker: React.FC<ShadowPickerProps> = ({ value, onChange, className }) => {
  // Parse the shadow value
  const parseShadow = (shadowValue: string) => {
    const parts = shadowValue.trim().split(' ');
    return {
      x: parseInt(parts[0] ?? '0') || 0,
      y: parseInt(parts[1] ?? '0') || 0,
      blur: parseInt(parts[2] ?? '0') || 0,
      spread: parseInt(parts[3] ?? '0') || 0,
      color: parts[4] || '#000000'
    };
  };

  const shadow = parseShadow(value || '0px 0px 0px 0px #000000');

  const handleChange = (field: 'x' | 'y' | 'blur' | 'spread' | 'color', newValue: string | number) => {
    const updatedShadow = { ...shadow, [field]: newValue };
    onChange(`${updatedShadow.x}px ${updatedShadow.y}px ${updatedShadow.blur}px ${updatedShadow.spread}px ${updatedShadow.color}`);
  };

  return (
    <div className={cn('flex gap-1 justify-between', className)}>
      <div className="flex items-center bg-white border border-gray-300/50 rounded-lg p-2.5">
        <span className="text-sm">X</span>
        <input
          type="number"
          value={shadow.x}
          onChange={e => handleChange('x', parseInt(e.target.value) || 0)}
          className="w-6 text-xs bg-transparent border-none text-center outline-none"
        />
      </div>
      <div className="flex items-center bg-white border border-gray-300/50 rounded-lg p-2.5">
        <span className="text-sm">Y</span>
        <input
          type="number"
          value={shadow.y}
          onChange={e => handleChange('y', parseInt(e.target.value) || 0)}
          className="w-6 text-xs bg-transparent border-none text-center outline-none"
        />
      </div>
      <div className="flex items-center bg-white border border-gray-300/50 rounded-lg p-2.5">
        <SunDim className="size-5" />
        <input
          type="number"
          value={shadow.blur}
          onChange={e => handleChange('blur', parseInt(e.target.value) || 0)}
          className="w-6 text-xs bg-transparent border-none text-center outline-none"
        />
      </div>
      <div className="flex items-center bg-white border border-gray-300/50 rounded-lg p-2.5">
        <Grip className="size-4" />
        <input
          type="number"
          value={shadow.spread}
          onChange={e => handleChange('spread', parseInt(e.target.value) || 0)}
          className="w-6 text-xs bg-transparent border-none text-center outline-none"
        />
      </div>
      <div className="flex items-center bg-white border border-gray-300/50 rounded-lg p-2.5">
        <input
          type="color"
          value={shadow.color}
          onChange={e => handleChange('color', e.target.value)}
          className="w-6 h-6 p-0 border-none cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ShadowPicker; 