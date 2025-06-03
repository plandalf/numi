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
  const [inputValue, setInputValue] = React.useState<string>(value.toString());

  // Sync inputValue with value prop
  React.useEffect(() => {
    // Only update if value prop changes from outside
    if (value.toString() !== inputValue) {
      setInputValue(value.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Allow empty string to clear the input
    setInputValue(newValue);
    // Only update parent if valid number
    if (newValue === "") return;
    const numValue = Number(newValue);
    if (!isNaN(numValue)) {
      // Don't clamp here, just let user type
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    // On blur, coerce to min/max or 0
    let numValue = Number(inputValue);
    if (inputValue === "" || isNaN(numValue)) {
      numValue = min !== undefined ? min : 0;
    }
    if (min !== undefined) numValue = Math.max(min, numValue);
    if (max !== undefined) numValue = Math.min(max, numValue);
    setInputValue(numValue.toString());
    if (numValue !== value) {
      onChange(numValue);
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-3">
      <Label className="text-sm capitalize">{label}</Label>
      <Input
        type="number"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
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
