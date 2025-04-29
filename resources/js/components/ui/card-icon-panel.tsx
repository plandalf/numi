import React from 'react';
import { cn } from '@/lib/utils';

interface CardIconPanelProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  icons?: Record<string, string | React.ReactNode>;
  labels?: Record<string, string>;
}

export const CardIconPanel: React.FC<CardIconPanelProps> = ({ options, value, onChange, icons, labels }) => {
  return (
    <div className="flex gap-3">
      {options.map((option) => {
        const isSelected = value === option;
        return (
          <button
            key={option}
            type="button"
            title={labels?.[option] ?? option}
            className={cn(
              'flex flex-col items-center justify-center rounded-lg border transition-colors px-4 py-1 min-w-[80px] bg-blue-950 border-transparent cursor-pointer',
              isSelected ? 'ring-3 ring-teal-600' : 'hover:bg-blue-950/50',
            )}
            onClick={() => onChange(option)}
            aria-pressed={isSelected}
          >
            {icons?.[option] && (
                icons[option]
            )}
          </button>
        );
      })}
    </div>
  );
}; 