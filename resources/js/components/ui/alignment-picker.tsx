import React from 'react';
import { cn } from '@/lib/utils';
import { AlignCenter, AlignCenterHorizontal, AlignEndHorizontal, AlignJustify, AlignLeft, AlignRight, AlignStartHorizontal } from 'lucide-react';

export interface AlignmentPickerConfig {
  orientation?: 'horizontal' | 'vertical';
}
interface AlignmentPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  options?: string[];
  config?: AlignmentPickerConfig;
}

export const verticalAlignmentIcons = {
  expand: <AlignJustify className="size-4" />,
  left: <AlignLeft className="size-4" />,
  center: <AlignCenter className="size-4" />,
  right: <AlignRight className="size-4" />,
  start: <AlignLeft className="size-4" />,
  end: <AlignRight className="size-4" />,
}

export const horizontalAlignmentIcons = { 
  start: <AlignStartHorizontal className="size-4" />,
  center: <AlignCenterHorizontal className="size-4" />,
  end: <AlignEndHorizontal className="size-4" />,
}

const AlignmentPicker: React.FC<AlignmentPickerProps> = ({ value, onChange, className, options, config }) => {

  const { orientation = 'vertical' } = config || {};

  return (
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
          {getAlignmentPickerValue(option as keyof typeof verticalAlignmentIcons | keyof typeof horizontalAlignmentIcons, orientation)}
         </button>
      ))}
    </div>
  )
};

export const getAlignmentPickerValue = (value: string, orientation: 'vertical' | 'horizontal' = 'vertical') => {
  return orientation === 'vertical' 
    ? verticalAlignmentIcons[value as keyof typeof verticalAlignmentIcons]
    : horizontalAlignmentIcons[value as keyof typeof horizontalAlignmentIcons]
}

export default AlignmentPicker; 