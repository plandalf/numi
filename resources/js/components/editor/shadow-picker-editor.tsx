import React from 'react';
import { Label } from '../ui/label';
import { parseShadow } from '../ui/shadow-picker';
import { Grip } from 'lucide-react';
import { SunDim } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShadowPickerEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export const ShadowPickerEditor: React.FC<ShadowPickerEditorProps> = ({ label, value, onChange }) => {
  const safeValue = value || '0px 0px 0px 0px #000000';

  // Parse the shadow value
  const shadow = parseShadow(safeValue);

  const handleChange = (field: 'x' | 'y' | 'blur' | 'spread' | 'color', newValue: string | number) => {
    const updatedShadow = { ...shadow, [field]: newValue };
    onChange(`${updatedShadow.x}px ${updatedShadow.y}px ${updatedShadow.blur}px ${updatedShadow.spread}px ${updatedShadow.color}`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="mb-1 block text-sm capitalize">{label}</Label>
      <div className={cn('flex gap-1 justify-between')}>
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
    </div>
  );
}; 