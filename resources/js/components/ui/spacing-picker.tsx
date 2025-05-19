import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { Tabs, TabsList, TabsTrigger } from "./tabs";
import { DragAdjuster } from "./drag-adjuster";

interface SpacingPickerProps {
  id?: string;
  value: string | null;
  defaultValue?: string | null;
  onChangeProperty: (value: string | null) => void;
}

export const SpacingPicker = ({
  id,
  value,
  defaultValue,
  onChangeProperty
}: SpacingPickerProps) => {
  // Initialize customInputValue with currentValue if it's a custom value, otherwise empty.
  // This helps pre-fill the input if a custom value was already set.
  const initialCustomValue = (value && value !== 'default' && value !== null) ? value : '';

  const [customInputValue, setCustomInputValue] = useState<string>(initialCustomValue);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCustomEditing, setIsCustomEditing] = useState<boolean>(
    Boolean(value && value !== 'default' && value !== null && /^\d+px$/.test(value))
  );

  // Parse pixel value to number
  const parsePixelValue = (value: string): number => {
    const match = value.match(/^(\d+)px$/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Format number to pixel value
  const formatPixelValue = (value: number): string => {
    return `${value}px`;
  };

  const handleFnClick = () => {
    if (isCustomEditing) {
      // Deactivating custom editing: revert to normal, clear error
      setIsCustomEditing(false);
      onChangeProperty('default');
      setValidationError(null);
      setCustomInputValue(''); // Reset input field
    } else {
      // Activating custom editing
      setIsCustomEditing(true);
      // If current value is 'default' or 'none', input starts empty or with placeholder
      // Otherwise, if it's a specific px value, prefill the input.
      const valueToEdit = (value && value !== 'default' && value !== null) ? value : '';
      setCustomInputValue(valueToEdit);
      // Do not call onChangeProperty here, let typing or blur handle it.
    }
  };

  const handleTabChange = (tabValue: string) => {
    setIsCustomEditing(false);
    setValidationError(null);
    if (tabValue === 'none') {
      onChangeProperty(null);
      setCustomInputValue('');
    } else { // 'normal' tab
      onChangeProperty('default');
      setCustomInputValue('');
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomInputValue(newValue);
    onChangeProperty(newValue); // Live update
    // Clear error as user types, validation happens on blur
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleCustomInputBlur = () => {
    if (!customInputValue && isCustomEditing) { // If input is empty on blur while editing, treat as no custom value
        setValidationError(null); // No error for empty, it's not an *invalid format*
        return;
    }

    // Format the value with px on blur
    const numericValue = customInputValue.replace(/[^0-9]/g, '');
    const formattedValue = numericValue ? `${numericValue}px` : '';
    
    if (numericValue && parseInt(numericValue, 10) <= 0) {
      setValidationError('Must be a positive pixel value.');
    } else {
      setValidationError(null);
      setCustomInputValue(formattedValue);
      onChangeProperty(formattedValue);
    }
  };

  const handleDragChange = (newValue: number) => {
    const formattedValue = formatPixelValue(newValue);
    setCustomInputValue(formattedValue);
    onChangeProperty(formattedValue);
    setValidationError(null);
  };

  const activeTab = value === null ? 'none' : 'normal';

  // If custom editing is active, don't show tabs as active.
  // Tabs only reflect 'default' or 'none'.
  const currentTabState = isCustomEditing ? undefined : activeTab;
  const currentPixelValue = parsePixelValue(customInputValue);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleFnClick}
          variant={isCustomEditing ? "secondary" : "ghost"} // Visually indicate active state
          size="xs"
          aria-pressed={isCustomEditing}
        >
          Fn
        </Button>
        {isCustomEditing ? (
          <DragAdjuster
            value={currentPixelValue}
            onChange={handleDragChange}
            min={1}
            max={100}
            step={1}
            className="w-full"
          >
            <Input
              type="text"
              id={id}
              value={customInputValue}
              onChange={handleCustomInputChange}
              onBlur={handleCustomInputBlur}
              placeholder="e.g., 10px"
              className={`flex-grow cursor-ew-resize ${validationError ? 'border-red-500' : ''}`}
            />
          </DragAdjuster>
        ) : (
          <Tabs value={currentTabState} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="normal">Normal</TabsTrigger>
              <TabsTrigger value="none">None</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      {validationError && isCustomEditing && (
        <p className="text-xs text-red-600 mt-1">{validationError}</p>
      )}
      {!isCustomEditing && value === 'default' && (
        <p className="text-xs text-muted-foreground">Default: {defaultValue || 'Theme default'}</p>
      )}
      {isCustomEditing && !validationError && (
        <p className="text-xs text-muted-foreground">Drag to adjust. Default: {defaultValue || 'Theme default'}</p>
      )}
    </>
  );
};