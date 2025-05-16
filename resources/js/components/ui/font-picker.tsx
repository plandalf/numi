import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Separator } from './separator';
import { Font } from '@/types';
import { Label } from './label';
import { AlignCenterIcon, AlignLeftIcon, AlignRightIcon, ArrowDownToLine, ArrowUpToLine, FoldVertical, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Input } from './input';
import { FontValue } from '@/contexts/Numi';

export const WEIGHT_LABELS: Record<string, string> = {
  '100': 'Thin',
  '200': 'Extra Light',
  '300': 'Light',
  '400': 'Regular',
  '500': 'Medium',
  '600': 'Semi Bold',
  '700': 'Bold',
  '800': 'Extra Bold',
  '900': 'Black',
};

const verticalAlignmentIcons = {
  left: <AlignLeftIcon className="size-4" />,
  center: <AlignCenterIcon className="size-4" />,
  right: <AlignRightIcon className="size-4" />,
}

const horizontalAlignmentIcons = {
  top: <ArrowUpToLine className="size-4" />,
  middle: <FoldVertical className="size-4" />,
  bottom: <ArrowDownToLine className="size-4" />,
}


export interface FontPickerConfig {
  hideLabel?: boolean;
  hideLineHeight?: boolean;
  hideLetterSpacing?: boolean;
  hideVerticalAlignment?: boolean;
  hideHorizontalAlignment?: boolean;
}

interface FontPickerProps {
  value: FontValue;
  onChange: (value: FontValue) => void;
  onClose?: () => void;
  config?: FontPickerConfig;
  className?: string;
  fonts: Font[];
}

export const FontPicker: React.FC<FontPickerProps> = ({
  value,
  onChange,
  onClose,
  config,
  className,
  fonts,
}) => {
  const { hideLabel, hideLineHeight, hideLetterSpacing, hideVerticalAlignment, hideHorizontalAlignment } = config || {};

  const selectedFont = fonts?.find(f => f.name === value.font);
  const availableWeights = selectedFont?.weights || [];

  const [localSize, setLocalSize] = useState(typeof value.size === 'string' ? value.size : '');
  const [localLetterSpacing, setLocalLetterSpacing] = useState(typeof value.letterSpacing === 'string' ? value.letterSpacing : '');
  const [localLineHeight, setLocalLineHeight] = useState(typeof value.lineHeight === 'string' ? value.lineHeight : '');

  useEffect(() => {
    setLocalSize(typeof value.size === 'string' ? value.size : '');
  }, [value.size]);

  useEffect(() => {
    setLocalLetterSpacing(typeof value.letterSpacing === 'string' ? value.letterSpacing : '');
  }, [value.letterSpacing]);

  useEffect(() => {
    setLocalLineHeight(typeof value.lineHeight === 'string' ? value.lineHeight : '');
  }, [value.lineHeight]);

  const handleFontChange = (newFont: string) => {
    const newSelectedFont = fonts?.find(f => f.name === newFont);
    const newAvailableWeights = newSelectedFont?.weights || [];
    
    // If current weight is not in the new font's weights, default to Regular (400)
    const newWeight = newAvailableWeights.includes(value?.weight || '') ? value.weight : '400';
    onChange({ ...value, font: newFont, weight: newWeight });
  };

  const formatPxValue = (val: string) => {
    if (!val) return '';
    if (val.endsWith('px')) return val;
    return val.replace(/[^\d]/g, '') + 'px';
  };

  return (
    <div className={cn("py-4 px-2.5 flex flex-col items-center gap-2 w-full", className)}>
      {!hideLabel && (
        <>
          <div className="flex items-center justify-between gap-2 w-full">
            <Label className="text-start">Font</Label>
            {onClose && (
              <X className="size-4 cursor-pointer" onClick={onClose} />
            )} 
          </div>
          <Separator className="my-2"/>
        </>
      )}
      <Select value={value.font} onValueChange={handleFontChange}>
        <SelectTrigger title='Font' className="truncate cursor-pointer text-sm" style={{ fontFamily: value.font }}>
          <SelectValue placeholder="Select a font" />
        </SelectTrigger>
        <SelectContent>
          {fonts?.map(font => (
            <SelectItem key={font.name} value={font.name} style={{ fontFamily: font.name }}>
              {font.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex flex-row gap-2 w-full">
        <Select value={value.weight} onValueChange={(newWeight) => onChange({ ...value, weight: newWeight })}>
          <SelectTrigger className="truncate" style={{ fontWeight: value.weight }}>
            <SelectValue title='Font Weight' placeholder="Select a weight" />
          </SelectTrigger>
          <SelectContent>
            {availableWeights.map(weight => (
              <SelectItem key={weight} value={weight} style={{ fontWeight: value.weight }}>
                {WEIGHT_LABELS[weight]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={localSize}
          onChange={(e) => setLocalSize(e.target.value)}
          onBlur={(e) => {
            const formatted = formatPxValue(e.target.value);
            if (formatted !== value.size) {
              onChange({ ...value, size: formatted });
            }
            setLocalSize(formatted);
          }}
          placeholder="Size"
        />
      </div>
      <div className="flex flex-row gap-2 w-full">
        {!hideLineHeight && (
          <div title='Line Height' className="flex flex-row gap-2 bg-gray-200/50 rounded-md py-2 px-3 items-center">
            <svg width="20" height="15" viewBox="0 0 12 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 15H0V14H12V15Z" fill="black"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9 11H8.11328L7.41113 9.01758H4.58887L3.88672 11H3L5.56348 4H6.43652L9 11ZM4.85449 8.26562H7.14551L6.02734 5.10742H5.97266L4.85449 8.26562Z" fill="black"/><path d="M12 1H0V0H12V1Z" fill="black"/></svg>
            <Input
              type='number'
              className="border-none shadow-none focus:!ring-0 focus:border-none h-5"
              value={localLineHeight}
              onChange={(e) => setLocalLineHeight(e.target.value)}
              onBlur={(e) => {
                if (e.target.value !== value.lineHeight) {
                  onChange({ ...value, lineHeight: e.target.value });
                }
                setLocalLineHeight(e.target.value);
              }}
              placeholder="Line Height"
            />
          </div>
        )}
        {!hideLetterSpacing && (
          <div title='Letter Spacing' className="flex flex-row gap-2 bg-gray-200/50 rounded-md py-2 px-3 items-center">
            <svg width="20" height="12" viewBox="0 0 14 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 12H0V0H1V12Z" fill="black"/><path d="M14 12H13V0H14V12Z" fill="black"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10 9H9.11328L8.41113 7.01758H5.58887L4.88672 9H4L6.56348 2H7.43652L10 9ZM5.85449 6.26562H8.14551L7.02734 3.10742H6.97266L5.85449 6.26562Z" fill="black"/></svg>
            <Input
              className="border-none shadow-none focus:!ring-0 focus:border-none h-5"
              value={localLetterSpacing}
              onChange={(e) => setLocalLetterSpacing(e.target.value)}
              onBlur={(e) => {
                const formatted = formatPxValue(e.target.value);
                if (formatted !== value.letterSpacing) {
                  onChange({ ...value, letterSpacing: formatted });
                }
                setLocalLetterSpacing(formatted);
              }}
              placeholder="Letter Spacing"
            />
          </div>
        )}
      </div>
      {(!hideVerticalAlignment || !hideHorizontalAlignment) && (
        <div className="flex flex-row gap-2 w-full">
          {!hideVerticalAlignment && (
            <div title='Vertical Alignment' className="flex flex-row gap-3 bg-gray-200/50 items-center justify-center rounded-md py-1 w-full h-9">
              {['left', 'center', 'right'].map((alignment) => {
                return (
                  <button
                    key={alignment}
                    type="button"
                    className={cn(
                      'px-2 py-1 flex items-center justify-center rounded cursor-pointer',
                      value.alignmentVertical === alignment ? 'bg-white text-black' : 'text-[#7C7BA1]'
                    )}
                    onClick={() => onChange({ ...value, alignmentVertical: alignment })}
                  >
                    {verticalAlignmentIcons[alignment as keyof typeof verticalAlignmentIcons]}
                  </button>
                )
              })}
            </div>
          )}
          {!hideHorizontalAlignment && (
            <div title='Horizontal Alignment' className="flex flex-row gap-3 bg-gray-200/50 items-center justify-center rounded-md py-1 w-full h-9">
              {['top', 'middle', 'bottom'].map((alignment) => {
                return (
                  <button
                    key={alignment}
                    type="button"
                    title={alignment.charAt(0).toUpperCase() + alignment.slice(1)}
                    className={cn(
                      'px-2 py-1 flex items-center justify-center rounded cursor-pointer',
                      value.alignmentHorizontal === alignment ? 'bg-white text-black' : 'text-[#7C7BA1]'
                    )}
                    onClick={() => onChange({ ...value, alignmentHorizontal: alignment })}
                  >
                    {horizontalAlignmentIcons[alignment as keyof typeof horizontalAlignmentIcons]}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 