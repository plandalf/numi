import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import { DragAdjuster } from "./drag-adjuster";
import { cn } from "@/lib/utils";

export interface SpacingPickerConfig {
  hideTabs?: boolean;
}

interface SpacingPickerProps {
  id?: string;
  value: string;
  defaultValue: string;
  onChangeProperty: (value: string) => void;
  className?: string;
  config?: SpacingPickerConfig;
}

export const SpacingPicker = ({
  id,
  value,
  defaultValue,
  onChangeProperty,
  className,
  config
}: SpacingPickerProps) => {
  const { hideTabs } = config ?? {};
  const initialCustomValue = (value && value !== defaultValue && value !== '0px') ? value : '';

  const [customInputValue, setCustomInputValue] = useState<string>(initialCustomValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCustomEditing, setIsCustomEditing] = useState<boolean>(hideTabs ||
    Boolean(value && value !== defaultValue && value !== '0px' && /^(\d+px)(\s+\d+px)*$/.test(value))
  );

  // Validate spacing values based on format
  const validateSpacingValues = (input: string): { isValid: boolean; error: string | null } => {
    if (!input) return { isValid: true, error: null };

    const values = input.trim().split(/\s+/);
    const validPixelFormat = /^\d+px$/;

    // Check if each value matches the pixel format
    const areAllValuesValid = values.every(val => validPixelFormat.test(val));
    if (!areAllValuesValid) {
      return { 
        isValid: false, 
        error: 'Each value must be in format: {number}px' 
      };
    }

    // Check number of values
    if (![1, 2, 3, 4].includes(values.length)) {
      return { 
        isValid: false, 
        error: 'Must have 1, 2, 3, or 4 values' 
      };
    }

    // Check if all numbers are non-negative
    const numbers = values.map(val => parseInt(val));
    if (numbers.some(num => num < 0)) {
      return { 
        isValid: false, 
        error: 'All values must be non-negative' 
      };
    }

    return { isValid: true, error: null };
  };

  const handleFnClick = () => {
    if (isCustomEditing) {
      setIsCustomEditing(false);
      onChangeProperty(defaultValue);
      setValidationError(null);
      setCustomInputValue('');
    } else {
      setIsCustomEditing(true);
      const valueToEdit = (value && value !== defaultValue && value !== '0px') ? value : '';
      setCustomInputValue(valueToEdit);
    }
  };

  const handleTabChange = (tabValue: string) => {
    setIsCustomEditing(false);
    setValidationError(null);
    if (tabValue === 'none') {
      onChangeProperty('0px');
      setCustomInputValue('0px');
    } else {
      onChangeProperty(defaultValue);
      setCustomInputValue(defaultValue);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomInputValue(newValue);

    // Only validate and update if there's actual content
    if (newValue.trim()) {
      const { isValid, error } = validateSpacingValues(newValue);
      setValidationError(error);
      if (isValid) {
        onChangeProperty(newValue);
      }
    } else {
      setValidationError(null);
    }
  };

  const handleCustomInputBlur = () => {
    if (!customInputValue && isCustomEditing) {
      setValidationError(null);
      return;
    }

    // Split the input and format each value
    const values = customInputValue.trim().split(/\s+/);
    const formattedValues = values
      .map(val => val.replace(/[^0-9]/g, ''))
      .filter(Boolean)
      .map(val => `${val}px`);

    const formattedInput = formattedValues.join(' ');
    
    const { isValid, error } = validateSpacingValues(formattedInput);
    
    if (isValid) {
      setValidationError(null);
      setCustomInputValue(formattedInput);
      onChangeProperty(formattedInput);
    } else {
      setValidationError(error);
    }
  };

  const activeTab = value === '0px' ? 'none' : 'normal';
  const currentTabState = isCustomEditing ? undefined : activeTab;

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {!hideTabs && (
          <Button
            onClick={handleFnClick}
            variant={isCustomEditing ? "secondary" : "ghost"}
            size="xs"
            aria-pressed={isCustomEditing}
          >
            Fn
          </Button>
        )}
        {isCustomEditing ? (
          <Input
            type="text"
            id={id}
            value={customInputValue}
            onChange={handleCustomInputChange}
            onBlur={handleCustomInputBlur}
            placeholder="e.g., 10px or 10px 20px"
            title="Enter spacing values"
            className={`flex-grow ${validationError ? 'border-red-500' : ''}`}
          />
        ) : !hideTabs ? (
          <Tabs value={currentTabState} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="normal">Normal</TabsTrigger>
              <TabsTrigger value="none">None</TabsTrigger>
            </TabsList>
          </Tabs>
        ) : null }
      </div>
    </>
  );
};