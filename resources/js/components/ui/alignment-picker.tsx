import React from 'react';
import { cn } from '@/lib/utils';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from 'lucide-react';

interface AlignmentPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const alignmentIcons = {
  expand: <AlignJustify className="size-4" />,
  left: <AlignLeft className="size-4" />,
  center: <AlignCenter className="size-4" />,
  right: <AlignRight className="size-4" />,
}

const AlignmentPicker: React.FC<AlignmentPickerProps> = ({ value, onChange, className }) => (
  <div className={cn('flex p-1 bg-[#EBEFFF] rounded-lg overflow-hidden', className)}>
    {['expand', 'left', 'center', 'right'].map((align) => (
      <button
        key={align}
        type="button"
        className={cn(
          'px-4 py-1 flex items-center justify-center rounded cursor-pointer',
          value === align ? 'bg-white text-black' : 'text-[#7C7BA1]'
        )}
        onClick={() => onChange(align)}
      >
        {alignmentIcons[align as keyof typeof alignmentIcons]}
       </button>
    ))}
  </div>
);

export default AlignmentPicker; 