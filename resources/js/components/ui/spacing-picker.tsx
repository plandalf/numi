import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import { DragAdjuster } from "./drag-adjuster";
import { cn } from "@/lib/utils";
import { getMatchedThemeValue } from "@/lib/theme";

export interface SpacingPickerConfig {
  hideTabs?: boolean;
  format?: 'single' | 'multi'
}

interface SpacingPickerProps {
  id?: string;
  value: string;
  defaultValue: string;
  defaultThemeKey?: string;
  onChangeProperty: (value: string) => void;
  className?: string;
  config?: SpacingPickerConfig;
}

export const SpacingPicker = ({
  id,
  value: initialValue,
  defaultValue,
  defaultThemeKey,
  onChangeProperty,
  className,
  config
}: SpacingPickerProps) => {

  const value = initialValue ?? defaultValue;
  const { hideTabs, format = 'multi' } = config ?? {};
  const matchedThemeValue = getMatchedThemeValue(value);
  const customValue = (matchedThemeValue == null && value && value !== defaultValue && value !== '0px') ? value : '';

  const [customInputValue, setCustomInputValue] = useState<string>(customValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCustomEditing, setIsCustomEditing] = useState<boolean>(hideTabs ||
    Boolean(value && value !== defaultValue && value !== '0px' && /^(\d+px)(\s+\d+px)*$/.test(value))
  );
  // Validate spacing values based on format
  const validateSpacingValues = (input: string): { isValid: boolean; error: string | null } => {
    if (!input) return { isValid: true, error: null };

    const values = input.trim().split(/\s+/);
    const validUnitFormat = /^-?\d*\.?\d+(px|rem)$/;

    // Check if each value matches the unit format
    const areAllValuesValid = values.every(val => validUnitFormat.test(val));
    if (!areAllValuesValid) {
      return { 
        isValid: false, 
        error: 'Each value must be in format: {number}px or {number}rem' 
      };
    }

    // For single format, only allow one value
    if (format === 'single' && values.length > 1) {
      return {
        isValid: false,
        error: 'Single format only accepts one value'
      };
    }

    // For multi format, check number of values
    if (format === 'multi' && ![1, 2, 3, 4].includes(values.length)) {
      return { 
        isValid: false, 
        error: 'Must have 1, 2, 3, or 4 values' 
      };
    }

    // Check if all numbers are non-negative
    const numbers = values.map(val => parseFloat(val));
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
      setCustomInputValue(customValue);
    }
  };

  const handleTabChange = (tabValue: string) => {
    setIsCustomEditing(false);
    setValidationError(null);
    if (tabValue === 'none') {
      onChangeProperty('0px');
      setCustomInputValue('0px');
    } else {
      onChangeProperty(defaultThemeKey ? `{{theme.${defaultThemeKey}}}` : '');
      setCustomInputValue('');
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomInputValue(newValue);
    
    if (!newValue.trim()) {
      setValidationError(null);
    }
  };

  const handleCustomInputBlur = () => {
    if (!customInputValue.trim()) {
      setValidationError(null);
      return;
    }

    // Split input into values and filter out empty strings
    const values = customInputValue.trim().split(/\s+/).filter(Boolean);
    const validUnitFormat = /^-?\d*\.?\d+(?:px|rem)$/;

    // Format values with units
    const formattedValues = values.map(val => {
      // If value already has valid unit, keep it as is
      if (validUnitFormat.test(val)) return val;
      
      // If value is just a number, add px as default unit
      const numericValue = val.replace(/[^0-9.-]/g, '');
      return numericValue ? `${numericValue}px` : '';
    }).filter(Boolean);

    // For single format, only keep the first valid value
    let finalValue = format === 'single' && formattedValues.length > 0
      ? formattedValues[0]
      : formattedValues.join(' ');

    setCustomInputValue(finalValue);

    // Validate the final value
    const { isValid, error } = validateSpacingValues(finalValue);
    setValidationError(error);
    
    if (isValid) {
      onChangeProperty(finalValue);
    }
  };

  const activeTab = value === '0px' ? 'none' : 'normal';
  const currentTabState = isCustomEditing ? undefined : activeTab;
  const isMultiValue = format === 'multi';

  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        {!hideTabs && (
          <Button
            onClick={handleFnClick}
            variant={isCustomEditing ? "default" : "ghost"}
            size="xs"
            className="!text-[12px] rounded-md"
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
            placeholder={isMultiValue ? "e.g., 10px 20px or 1rem 2rem" : "e.g., 10px or 1rem"}
            title={isMultiValue ? "Enter multiple spacing values" : "Enter a spacing value"}
            className={`h-[40px] flex-grow ${validationError ? 'border-red-500' : ''}`}
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