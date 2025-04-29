import React from 'react';
import { cn } from '@/lib/utils';
import { Grip, SunDim, X } from 'lucide-react';

interface ShadowPickerProps {
  value: { borderX: string; borderY: string; borderBlur: string; borderSpread: string };
  onChange: (value: { borderX: string; borderY: string; borderBlur: string; borderSpread: string }) => void;
  className?: string;
}

const ShadowPicker: React.FC<ShadowPickerProps> = ({ value, onChange, className }) => (
  <div className={cn('flex gap-1 justify-between', className)}>
    <div className="flex items-center bg-white  border border-gray-300/50 rounded-lg p-2 gap-1">
      <span className="text-sm">X</span>
      <input
        type="number"
        min={0}
        value={String(value.borderX ?? 2)}
        onChange={e => onChange({ ...value, borderX: String(e.target.value) })}
        className="w-8 text-xs bg-transparent border-none text-center outline-none"
      />
    </div>
    <div className="flex items-center bg-white  border border-gray-300/50 rounded-lg p-2 gap-1">
      <span className="text-sm">Y</span>
      <input
        type="number"
        min={0}
        value={String(value.borderY ?? 2)}
        onChange={e => onChange({ ...value, borderY: String(e.target.value) })}
        className="w-8 text-xs bg-transparent border-none text-center outline-none"
      />
    </div>
    <div className="flex items-center bg-white  border border-gray-300/50 rounded-lg p-2 gap-1">
      <SunDim className="size-5" />
      <input
        type="number"
        min={0}
        value={String(value.borderBlur ?? 2)}
        onChange={e => onChange({ ...value, borderBlur: String(e.target.value) })}
        className="w-8 text-xs bg-transparent border-none text-center outline-none"
      />
    </div>
    <div className="flex items-center bg-white  border border-gray-300/50 rounded-lg p-2 gap-1">
      <Grip className="size-4" />
      <input
        type="number"
        min={0}
        value={String(value.borderSpread ?? 2)}
        onChange={e => onChange({ ...value, borderSpread: String(e.target.value) })}
        className="w-8 text-xs bg-transparent border-none text-center outline-none"
      />
    </div>
  </div>
);

export default ShadowPicker; 