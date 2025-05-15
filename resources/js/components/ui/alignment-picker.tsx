import React from 'react';
import { cn } from '@/lib/utils';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from 'lucide-react';

interface AlignmentPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  options?: string[];
}

export const alignmentIcons = {
  expand: <AlignJustify className="size-4" />,
  left: <AlignLeft className="size-4" />,
  center: <AlignCenter className="size-4" />,
  right: <AlignRight className="size-4" />,
}

const AlignmentPicker: React.FC<AlignmentPickerProps> = ({ value, onChange, className, options }) => (
  <div className={cn('flex p-1 bg-[#EBEFFF] rounded-lg overflow-hidden', className)}>
    {(options ?? ['expand', 'left', 'center', 'right']).map((option) => (
      <button
        key={option}
        type="button"
        className={cn(
          'px-4 py-1 flex items-center justify-center rounded cursor-pointer',
          value === option ? 'bg-white text-black' : 'text-[#7C7BA1]'
        )}
        onClick={() => onChange(option)}
      >
        {alignmentIcons[option as keyof typeof alignmentIcons]}
       </button>
    ))}
  </div>
);

export default AlignmentPicker; 