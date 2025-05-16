import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from './separator';
import { Label } from './label';
import {  X } from 'lucide-react';
import { Input } from './input';
import { DimensionValue } from '@/contexts/Numi';
import { DragAdjuster } from './drag-adjuster';

export interface DimensionPickerConfig {
  hideLabel?: boolean;
  hideWidth?: boolean;
  hideHeight?: boolean;
  minWidth?: number;
  maxWidth?: number;
  minHeight?: number;
  maxHeight?: number;
}

interface DimensionPickerProps {
  value: DimensionValue;
  onChange: (value: DimensionValue) => void;
  onClose?: () => void;
  config?: DimensionPickerConfig;
  className?: string;
}

export const DimensionPicker: React.FC<DimensionPickerProps> = ({
  value,
  onChange,
  onClose,
  config,
  className,
}) => {
  const { hideLabel, hideWidth, hideHeight } = config || {};
  const { minWidth = 0, maxWidth = 300, minHeight = 0, maxHeight = 300 } = config || {};

  const [localWidth, setLocalWidth] = useState(typeof value.width === 'string' ? value.width : '');
  const [localHeight, setLocalHeight] = useState(typeof value.height === 'string' ? value.height : '');

  useEffect(() => {
    setLocalWidth(typeof value.width === 'string' ? value.width : '');
  }, [value.width]);

  useEffect(() => {
    setLocalHeight(typeof value.height === 'string' ? value.height : '');
  }, [value.height]);

  const handleWidthChange = (newValue: number) => {
    const formatted = `${newValue}px`;
    setLocalWidth(formatted);
    onChange({ ...value, width: formatted });
  };

  const handleHeightChange = (newValue: number) => {
    const formatted = `${newValue}px`;
    setLocalHeight(formatted);
    onChange({ ...value, height: formatted });
  };

  const getRadiusValue = (radius: string) => {
    return parseInt(radius.replace('px', '')) || 0;
  };

  return (
    <div className={cn("py-4 px-2.5 flex flex-col items-center gap-2 w-full", className)}>
      {!hideLabel && (
        <>
          <div className="flex items-center justify-between gap-2 w-full">
            <Label className="text-start">Dimensions</Label>
            {onClose && (
              <X className="size-4 cursor-pointer" onClick={onClose} />
            )} 
          </div>
          <Separator className="my-2"/>
        </>
      )}
      {!hideWidth && (
        <div className="flex flex-row gap-2 w-full items-center">
          <Label className="min-w-[80px]">Width</Label>
          <div className="flex flex-row gap-2 w-full">
            <DragAdjuster
              value={getRadiusValue(localWidth)}
              onChange={handleWidthChange}
              min={minWidth}
              max={maxWidth}
            >
              <div title='Width' className="flex flex-row gap-2 bg-gray-200/50 rounded-md py-2 px-3 items-center  w-full">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 7.5C2 7.22386 2.22386 7 2.5 7H12.5C12.7761 7 13 7.22386 13 7.5C13 7.77614 12.7761 8 12.5 8H2.5C2.22386 8 2 7.77614 2 7.5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
                <Input
                  readOnly
                  className="cursor-pointer w-12 border-none shadow-none focus:!ring-0 focus:border-none h-5 p-0"
                  value={localWidth}
                />
              </div>
            </DragAdjuster>
          </div>
        </div>
      )}
      {!hideHeight && (
        <div className="flex flex-row gap-2 w-full items-center">
          <Label className="min-w-[80px]">Height</Label>
          <div className="flex flex-row gap-2 w-full">
            <DragAdjuster
              value={getRadiusValue(localHeight)}
              onChange={handleHeightChange}
              min={minHeight}
              max={maxHeight}
            >
              <div title='Height' className="flex flex-row gap-2 bg-gray-200/50 rounded-md py-2 px-3 items-center  w-full">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 2C7.77614 2 8 2.22386 8 2.5L8 12.5C8 12.7761 7.77614 13 7.5 13C7.22386 13 7 12.7761 7 12.5L7 2.5C7 2.22386 7.22386 2 7.5 2Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              <Input
                readOnly
                className="cursor-pointer w-12 border-none shadow-none focus:!ring-0 focus:border-none h-5 p-0"
                value={localHeight}
              />
              </div>
            </DragAdjuster>
          </div>
        </div>
      )}
    </div>
  );
}; 