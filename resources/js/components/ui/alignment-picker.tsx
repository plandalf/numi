import React from 'react';
import { cn } from '@/lib/utils';

interface AlignmentPickerProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const AlignmentPicker: React.FC<AlignmentPickerProps> = ({ value, onChange, className }) => (
  <div className={cn('flex p-1 bg-[#EBEFFF] rounded-lg overflow-hidden', className)}>
    {['left', 'center', 'right'].map((align) => (
      <button
        key={align}
        type="button"
        className={cn(
          'px-4 py-1 flex items-center justify-center rounded cursor-pointer',
          value === align ? 'bg-white text-black' : 'text-[#7C7BA1]'
        )}
        onClick={() => onChange(align)}
      >
        {align === 'left' && <span className="inline-block w-5 h-5"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="14" y2="6" /><line x1="4" y1="10" x2="18" y2="10" /><line x1="4" y1="14" x2="10" y2="14" /></svg></span>}
        {align === 'center' && <span className="inline-block w-5 h-5"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="6" x2="16" y2="6" /><line x1="4" y1="10" x2="18" y2="10" /><line x1="6" y1="14" x2="16" y2="14" /></svg></span>}
        {align === 'right' && <span className="inline-block w-5 h-5"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="10" y1="6" x2="18" y2="6" /><line x1="4" y1="10" x2="18" y2="10" /><line x1="14" y1="14" x2="18" y2="14" /></svg></span>}
      </button>
    ))}
  </div>
);

export default AlignmentPicker; 