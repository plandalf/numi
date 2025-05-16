import React, { useState } from 'react';
import { Button } from '../ui/button';
import { PlusIcon, Type } from 'lucide-react';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ColorPicker, parseHexAlpha } from '../ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import AlignmentPicker, { alignmentIcons } from '../ui/alignment-picker';
import { Kebab } from '../ui/kebab';
import { Checkbox } from '../ui/checkbox';
import { Font } from '@/types';
import { FontPicker, WEIGHT_LABELS } from '../ui/font-picker';
import { BorderValue, FontValue } from '@/contexts/Numi';
import { BorderPicker } from '../ui/border-picker';
import { BorderRadiusPicker } from '../ui/border-radius-picker';
import ShadowPicker from '../ui/shadow-picker';

export interface StyleItem {
  name: string;
  label: string;
  value?: any;
  defaultValue: any;
  inspector: 'colorPicker' | 'alignmentPicker' | 'fontPicker' | 'borderPicker' | 'borderRadiusPicker' | 'shadowPicker' | 'select' | 'checkbox';
  options?: Record<string, any>;
  config?: Record<string, any>;
}

interface StyleEditorProps {
  items: StyleItem[];
  onChange: (key: string, value: any) => void;
  onDelete: (key: string) => void;
  themeColors?: Record<string, string>;
  fonts?: Font[];
}

interface StyleItemValuePreviewProps extends Pick<StyleEditorProps, 'onChange' | 'themeColors' | 'fonts'> {
  item: StyleItem;
}

const StyleItemValuePreview = ({
  item,
  onChange,
  themeColors,
  fonts,
}: StyleItemValuePreviewProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const value = item.value || item.defaultValue;
  switch (item.inspector) {
    case 'colorPicker':
      const { rgb } = parseHexAlpha(value as string);
      return (
        <ColorPicker
          type="advanced"
          value={value as string}
          onChange={(value) => onChange(item.name, value)}
          trigger={
            <div className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
               <div className="w-5 h-5 rounded cursor-pointer" style={{ backgroundColor: value as string }} />
               <span className="text-xs">{rgb}</span>
            </div>
          }
          themeColors={themeColors}
        />
      );
    case 'alignmentPicker':
      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <span className="bg-gray-200 rounded p-0.5">
                {alignmentIcons[value as keyof typeof alignmentIcons]}
                </span>
              <span className="text-xs capitalize">{value}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="justify-center">
            <AlignmentPicker
              value={value as string}
              onChange={(value) => onChange(item.name, value)}
              options={Object.keys(item.options || {})}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case 'fontPicker':
      const fontValue = value as FontValue;
      const fontValueAsTitle = `${fontValue.font}, ${WEIGHT_LABELS[fontValue.weight as keyof typeof WEIGHT_LABELS]}`;

      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <Type className="size-5 border border-gray-200 rounded p-0.5" />
              <span
                className="text-xs truncate max-w-[90px]"
                title={fontValueAsTitle}
              >
                {fontValueAsTitle}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="justify-center">
            <FontPicker
              className="w-full max-w-[300px]"
              value={value as FontValue}
              onChange={(value) => onChange(item.name, value as FontValue)}
              fonts={fonts ?? []}
              onClose={() => setIsOpen(false)}
              config={item.config}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case 'borderPicker':
      const borderValue = value as BorderValue;
      const borderValueAsTitle = `${borderValue.width}, ${borderValue.style}`;

      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 2L4.87935 2C4.47687 1.99999 4.14469 1.99999 3.87409 2.0221C3.59304 2.04506 3.33469 2.09434 3.09202 2.21799C2.7157 2.40973 2.40973 2.7157 2.21799 3.09202C2.09434 3.33469 2.04506 3.59304 2.0221 3.87409C1.99999 4.14468 1.99999 4.47686 2 4.87933V4.87935V5.5C2 5.77614 2.22386 6 2.5 6C2.77614 6 3 5.77614 3 5.5V4.9C3 4.47171 3.00039 4.18056 3.01878 3.95552C3.03669 3.73631 3.06915 3.62421 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.62421 3.06915 3.73631 3.03669 3.95552 3.01878C4.18056 3.00039 4.47171 3 4.9 3H5.5C5.77614 3 6 2.77614 6 2.5C6 2.22386 5.77614 2 5.5 2ZM13 9.5C13 9.22386 12.7761 9 12.5 9C12.2239 9 12 9.22386 12 9.5V10.1C12 10.5283 11.9996 10.8194 11.9812 11.0445C11.9633 11.2637 11.9309 11.3758 11.891 11.454C11.7951 11.6422 11.6422 11.7951 11.454 11.891C11.3758 11.9309 11.2637 11.9633 11.0445 11.9812C10.8194 11.9996 10.5283 12 10.1 12H9.5C9.22386 12 9 12.2239 9 12.5C9 12.7761 9.22386 13 9.5 13H10.1206C10.5231 13 10.8553 13 11.1259 12.9779C11.407 12.9549 11.6653 12.9057 11.908 12.782C12.2843 12.5903 12.5903 12.2843 12.782 11.908C12.9057 11.6653 12.9549 11.407 12.9779 11.1259C13 10.8553 13 10.5232 13 10.1207V10.1207V10.1207V10.1206V9.5ZM2.5 9C2.77614 9 3 9.22386 3 9.5V10.1C3 10.5283 3.00039 10.8194 3.01878 11.0445C3.03669 11.2637 3.06915 11.3758 3.10899 11.454C3.20487 11.6422 3.35785 11.7951 3.54601 11.891C3.62421 11.9309 3.73631 11.9633 3.95552 11.9812C4.18056 11.9996 4.47171 12 4.9 12H5.5C5.77614 12 6 12.2239 6 12.5C6 12.7761 5.77614 13 5.5 13H4.87935C4.47687 13 4.14469 13 3.87409 12.9779C3.59304 12.9549 3.33469 12.9057 3.09202 12.782C2.7157 12.5903 2.40973 12.2843 2.21799 11.908C2.09434 11.6653 2.04506 11.407 2.0221 11.1259C1.99999 10.8553 1.99999 10.5231 2 10.1207V10.1206V10.1V9.5C2 9.22386 2.22386 9 2.5 9ZM10.1 3C10.5283 3 10.8194 3.00039 11.0445 3.01878C11.2637 3.03669 11.3758 3.06915 11.454 3.10899C11.6422 3.20487 11.7951 3.35785 11.891 3.54601C11.9309 3.62421 11.9633 3.73631 11.9812 3.95552C11.9996 4.18056 12 4.47171 12 4.9V5.5C12 5.77614 12.2239 6 12.5 6C12.7761 6 13 5.77614 13 5.5V4.87935V4.87934C13 4.47686 13 4.14468 12.9779 3.87409C12.9549 3.59304 12.9057 3.33469 12.782 3.09202C12.5903 2.7157 12.2843 2.40973 11.908 2.21799C11.6653 2.09434 11.407 2.04506 11.1259 2.0221C10.8553 1.99999 10.5231 1.99999 10.1206 2L10.1 2H9.5C9.22386 2 9 2.22386 9 2.5C9 2.77614 9.22386 3 9.5 3H10.1Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              <span
                className="text-xs capitalize truncate max-w-[85px]"
                title={borderValueAsTitle}
              >
                {borderValueAsTitle}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="justify-center">
            <BorderPicker
              className="w-full max-w-[300px]"
              value={value as BorderValue}
              onChange={(value) => onChange(item.name, value as BorderValue)}
              onClose={() => setIsOpen(false)}
              config={item.config}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case 'borderRadiusPicker':
      return (
        <BorderRadiusPicker
          className="w-full max-w-[300px]"
          value={value}
          onChange={(value) => onChange(item.name, value as BorderValue)}
          min={item.config?.min}
          max={item.config?.max}
        />
      );
    case 'shadowPicker':
      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1C0.447715 1 0 1.44772 0 2V13C0 13.5523 0.447715 14 1 14H14C14.5523 14 15 13.5523 15 13V2C15 1.44772 14.5523 1 14 1H1ZM7.5 10.625C9.22589 10.625 10.625 9.22589 10.625 7.5C10.625 5.77411 9.22589 4.375 7.5 4.375C5.77411 4.375 4.375 5.77411 4.375 7.5C4.375 9.22589 5.77411 10.625 7.5 10.625Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              <span
                className="text-xs capitalize truncate max-w-[85px]"
                title={value}
              >
                {value}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="justify-center">
            <ShadowPicker
              className="w-full max-w-[300px]"
              value={value}
              onChange={(value) => onChange(item.name, value as BorderValue)}
              onClose={() => setIsOpen(false)}
              themeColors={themeColors}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case 'select':
      return (
        <Select value={value as string} onValueChange={(value) => onChange(item.name, value)}>
          <SelectTrigger className="flex-1 h-fit p-0 shadow-none border-none w-fit cursor-pointer">
            <SelectValue placeholder={item.defaultValue} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(item?.options || {}).map(([key, value]) => (
                <SelectItem key={key} value={key}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
    case 'checkbox':
      return (
        <Checkbox checked={value as boolean} onCheckedChange={(value) => onChange(item.name, value as boolean)} />
      );
    default:
      return <span className="text-sm">{item.value}</span>;
  }
};

export const StyleEditor: React.FC<StyleEditorProps> = ({
  items,
  onChange,
  onDelete,
  themeColors,
  fonts,
} : StyleEditorProps) => {

  const itemsWithValue = items.filter((item) => item.value != undefined);
  const itemsWithoutValue = items.filter((item) => item.value == undefined);

  return (
    <div className="flex flex-col gap-2 p-2 border rounded-md border-gray-200 bg-gray-100/50 h-full">
      {itemsWithValue?.map((item) => (
        <div key={item.name} className="h-9 flex flex-row gap-2 items-center bg-white rounded-md border border-gray-200">
          <Label title={item.label} className="ml-2 text-sm w-28 truncate">{item.label}</Label>
          <Separator orientation="vertical" className="h-full" />
          <div className="flex-1 flex flex-row gap-2 items-center justify-between">
            <StyleItemValuePreview item={item} onChange={onChange} themeColors={themeColors} fonts={fonts} />
            <Kebab
            items={[
                {
                  label: 'Delete',
                  onClick: () => onDelete?.(item.name)
                }
              ]}
            />
          </div>
        </div>
      ))}
      {itemsWithoutValue.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            {itemsWithValue.length > 0 ? 'Add another style' : 'Add a style'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="min-w-[200px]">
          {itemsWithoutValue.map((item) => (
            <DropdownMenuItem
              key={item.name}
              onClick={() => onChange(item.name, item.defaultValue)}
            >
              {item.label}
            </DropdownMenuItem>
          ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};