import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from './separator';
import { Label } from './label';
import {  X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { BorderValue } from '@/contexts/Numi';
import { DragAdjuster } from './drag-adjuster';

export interface BorderPickerConfig {
  hideLabel?: boolean;
}

interface BorderPickerProps {
  value: BorderValue;
  onChange: (value: BorderValue) => void;
  onClose?: () => void;
  config?: BorderPickerConfig;
  className?: string;
}

export const BorderPicker: React.FC<BorderPickerProps> = ({
  value,
  onChange,
  onClose,
  config,
  className,
}) => {
  const { hideLabel } = config || {};

  const styleOptions = [
    { value: 'none', label: 'None' },
    { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' },
    { value: 'dotted', label: 'Dotted' },
    { value: 'double', label: 'Double' },
  ];

  const [localWidth, setLocalWidth] = useState(typeof value.width === 'string' ? value.width : '');

  useEffect(() => {
    setLocalWidth(typeof value.width === 'string' ? value.width : '');
  }, [value.width]);

  const handleWidthChange = (newValue: number) => {
    const formatted = `${newValue}px`;
    setLocalWidth(formatted);
    onChange({ ...value, width: formatted });
  };

  const getRadiusValue = (radius: string) => {
    return parseInt(radius.replace('px', '')) || 0;
  };

  return (
    <div className={cn("py-4 px-2.5 flex flex-col items-center gap-2 w-full", className)}>
      {!hideLabel && (
        <>
          <div className="flex items-center justify-between gap-2 w-full">
            <Label className="text-start">Border</Label>
            {onClose && (
              <X className="size-4 cursor-pointer" onClick={onClose} />
            )} 
          </div>
          <Separator className="my-2"/>
        </>
      )}
      <div className="flex flex-row gap-2 w-full items-center">
        <Label className="min-w-[80px]">Width</Label>
        <div className="flex flex-row gap-2 w-full">
          <DragAdjuster
            value={getRadiusValue(localWidth)}
            onChange={handleWidthChange}
            max={40}
          >
            <div title='Border Width' className="flex flex-row gap-2 bg-gray-200/50 rounded-md py-2 px-3 items-center  w-full">
              <svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 16H2.5V11.3331H16.5V16Z" fill="#808ABF"/><path d="M16.5 8.53311H2.5V5.73311H16.5V8.53311Z" fill="#808ABF"/><path d="M16.5 2.93311H2.5V2H16.5V2.93311Z" fill="#808ABF"/></svg>
              <Input
                readOnly
                title='Drag and drop to adjust'
                className="cursor-ew-resize w-12 border-none shadow-none focus:!ring-0 focus:border-none h-5 p-0"
                value={localWidth}
              />
            </div>
          </DragAdjuster>
        </div>
      </div>
      <div className="flex flex-row gap-2 w-full items-center">
        <Label className="min-w-[80px]">Style</Label>
        <Select value={value.style} onValueChange={(newStyle) => onChange({ ...value, style: newStyle })}>
          <SelectTrigger title='Style' className="truncate cursor-pointer text-sm">
            <SelectValue placeholder="Select a stroke" />
          </SelectTrigger>
          <SelectContent>
            {styleOptions.map(style => (
              <SelectItem key={style.value} value={style.value}>
                {style.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}; 