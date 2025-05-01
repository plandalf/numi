import { Label } from '../ui/label';
import { Input } from '../ui/input';
import React from 'react';

interface NumberEditorProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}

export const NumberEditor: React.FC<NumberEditorProps> = ({
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step = 1,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow empty string to clear the input
    if (newValue === '') {
      onChange(0);
      return;
    }

    // Convert to number and validate
    const numValue = Number(newValue);
    if (!isNaN(numValue)) {
      // Apply min/max constraints
      let constrainedValue = numValue;

      // Prevent negative values if min is not explicitly set
      if (min === undefined) {
        constrainedValue = Math.max(0, constrainedValue);
      } else {
        constrainedValue = Math.max(min, constrainedValue);
      }

      if (max !== undefined) {
        constrainedValue = Math.min(max, constrainedValue);
      }

      // Only update if the value is actually different
      if (constrainedValue !== value) {
        onChange(constrainedValue);
      }
    }
  };

  // Ensure value is within bounds
  const displayValue = (() => {
    if (min !== undefined && value < min) return min;
    if (max !== undefined && value > max) return max;
    return value;
  })();

  return (
    <div className="flex flex-col gap-2 mb-3">
      <Label className="text-sm capitalize">{label}</Label>
      <Input
        type="number"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full"
        onKeyDown={(e) => {
          // Prevent typing invalid characters
          if (e.key === '-' && min !== undefined && min >= 0) {
            e.preventDefault();
          }
        }}
      />
    </div>
  );
};
