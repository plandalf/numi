import React, { useState } from 'react';
import { Image, Info, PlusIcon, Ruler, Type } from 'lucide-react';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ColorPicker, parseHexAlpha } from '../ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import AlignmentPicker, { alignmentIcons, getAlignmentPickerValue } from '../ui/alignment-picker';
import { Kebab } from '../ui/kebab';
import { Checkbox } from '../ui/checkbox';
import { Font } from '@/types';
import { FontPicker, WEIGHT_LABELS } from '../ui/font-picker';
import { BorderValue, DimensionValue, FontValue } from '@/contexts/Numi';
import { BorderPicker } from '../ui/border-picker';
import { BorderRadiusPicker } from '../ui/border-radius-picker';
import ShadowPicker from '../ui/shadow-picker';
import { DimensionPicker } from '../ui/dimension-picker';
import { ImageUpload } from '../ui/image-upload';
import { Combobox } from '../combobox';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Tooltip } from '../ui/tooltip';
import { cn } from '@/lib/utils';
import { SpacingPicker } from '../ui/spacing-picker';
import { getMatchedThemeValue } from '@/lib/theme';

export interface StyleItem {
  name: string;
  label: string;
  value?: any;
  defaultValue: any;
  inspector:
    'colorPicker'
    | 'alignmentPicker'
    | 'fontPicker'
    | 'fontFamilyPicker'
    | 'borderPicker'
    | 'borderRadiusPicker'
    | 'dimensionPicker'
    | 'shadowPicker'
    | 'spacingPicker'
    | 'imagePicker'
    | 'select'
    //sizepicker?
    | 'checkbox';
  options?: Record<string, any>;
  config?: Record<string, any>;
  tooltip?: string;
}

interface StyleEditorProps {
  items: StyleItem[];
  onChange: (key: string, value: any) => void;
  onDelete?: (key: string) => void;
  themeColors?: Record<string, { value: string, label: string }>;
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
    case 'colorPicker': {
      // Check if the value is a gradient
      const isGradient = typeof value === 'string' && 
        (value.includes('linear-gradient') || value.includes('radial-gradient'));
      
      const { rgb } = isGradient ? { rgb: '#000000' } : parseHexAlpha(value as string);
      const matchedThemeValue = getMatchedThemeValue(value as string);

      const colorValue = matchedThemeValue ? themeColors?.[matchedThemeValue]?.value : rgb;
      const colorLabel = matchedThemeValue ? themeColors?.[matchedThemeValue]?.label : (isGradient ? 'Gradient' : rgb);
      
      return (
        <ColorPicker
          type="advanced"
          value={value as string}
          onChange={(value) => onChange(item.name, value)}
          trigger={
            <div className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
               <div 
                 className="w-5 h-5 rounded cursor-pointer" 
                 style={{ 
                   background: isGradient ? (value as string) : (colorValue as string) 
                 }} 
               />
               <span className="text-xs">{colorLabel != '' ? colorLabel : 'Select'}</span>
            </div>
          }
          themeColors={themeColors}
          supportsGradients={item.config?.supportsGradients}
        />
      );
    }
    case 'alignmentPicker':
      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <span className="bg-gray-200 rounded p-0.5">
                {getAlignmentPickerValue(value, item.config?.orientation ?? 'vertical')}
                </span>
              <span className="flex-1 capitalize text-xs line-clamp-2">{value}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="justify-center">
            <AlignmentPicker
              value={value as string}
              onChange={(value) => onChange(item.name, value)}
              options={Object.keys(item.options || {})}
              config={item.config}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case 'fontPicker':
      const fontValue = value as FontValue;
      const matchedColorThemeValue = getMatchedThemeValue(value?.color as string);
      const fontValueAsTitle = `${fontValue.font ?? 'Font'} ${WEIGHT_LABELS[fontValue.weight as keyof typeof WEIGHT_LABELS] ?? ''}`
      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="flex flex-row gap-2 items-center cursor-pointer">
              <Type
                className="size-5 border border-gray-200 rounded p-0.5"
                style={{
                  color: matchedColorThemeValue ? themeColors?.[matchedColorThemeValue]?.value : fontValue?.color ?? '#000000',
                }}
              />
              <span
                className="flex-1 text-xs line-clamp-2"
                title={fontValueAsTitle}
              >
                {fontValueAsTitle}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="justify-center">
            <FontPicker
              className="w-full max-w-[310px]"
              value={value as FontValue}
              onChange={(value) => onChange(item.name, value as FontValue)}
              fonts={fonts ?? []}
              onClose={() => setIsOpen(false)}
              config={item.config}
              themeColors={themeColors}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case 'borderPicker':
      const borderValue = value as BorderValue;
      const borderValueAsTitle =
        borderValue.width && borderValue.style
          ? `${borderValue.width}, ${borderValue.style}`
          : borderValue.width
            ? `${borderValue.width}`
            : borderValue.style
              ? `${borderValue.style}`
              :'Select';

      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.5 2L4.87935 2C4.47687 1.99999 4.14469 1.99999 3.87409 2.0221C3.59304 2.04506 3.33469 2.09434 3.09202 2.21799C2.7157 2.40973 2.40973 2.7157 2.21799 3.09202C2.09434 3.33469 2.04506 3.59304 2.0221 3.87409C1.99999 4.14468 1.99999 4.47686 2 4.87933V4.87935V5.5C2 5.77614 2.22386 6 2.5 6C2.77614 6 3 5.77614 3 5.5V4.9C3 4.47171 3.00039 4.18056 3.01878 3.95552C3.03669 3.73631 3.06915 3.62421 3.10899 3.54601C3.20487 3.35785 3.35785 3.20487 3.54601 3.10899C3.62421 3.06915 3.73631 3.03669 3.95552 3.01878C4.18056 3.00039 4.47171 3 4.9 3H5.5C5.77614 3 6 2.77614 6 2.5C6 2.22386 5.77614 2 5.5 2ZM13 9.5C13 9.22386 12.7761 9 12.5 9C12.2239 9 12 9.22386 12 9.5V10.1C12 10.5283 11.9996 10.8194 11.9812 11.0445C11.9633 11.2637 11.9309 11.3758 11.891 11.454C11.7951 11.6422 11.6422 11.7951 11.454 11.891C11.3758 11.9309 11.2637 11.9633 11.0445 11.9812C10.8194 11.9996 10.5283 12 10.1 12H9.5C9.22386 12 9 12.2239 9 12.5C9 12.7761 9.22386 13 9.5 13H10.1206C10.5231 13 10.8553 13 11.1259 12.9779C11.407 12.9549 11.6653 12.9057 11.908 12.782C12.2843 12.5903 12.5903 12.2843 12.782 11.908C12.9057 11.6653 12.9549 11.407 12.9779 11.1259C13 10.8553 13 10.5232 13 10.1207V10.1207V10.1207V10.1206V9.5ZM2.5 9C2.77614 9 3 9.22386 3 9.5V10.1C3 10.5283 3.00039 10.8194 3.01878 11.0445C3.03669 11.2637 3.06915 11.3758 3.10899 11.454C3.20487 11.6422 3.35785 11.7951 3.54601 11.891C3.62421 11.9309 3.73631 11.9633 3.95552 11.9812C4.18056 11.9996 4.47171 12 4.9 12H5.5C5.77614 12 6 12.2239 6 12.5C6 12.7761 5.77614 13 5.5 13H4.87935C4.47687 13 4.14469 13 3.87409 12.9779C3.59304 12.9549 3.33469 12.9057 3.09202 12.782C2.7157 12.5903 2.40973 12.2843 2.21799 11.908C2.09434 11.6653 2.04506 11.407 2.0221 11.1259C1.99999 10.8553 1.99999 10.5231 2 10.1207V10.1206V10.1V9.5C2 9.22386 2.22386 9 2.5 9ZM10.1 3C10.5283 3 10.8194 3.00039 11.0445 3.01878C11.2637 3.03669 11.3758 3.06915 11.454 3.10899C11.6422 3.20487 11.7951 3.35785 11.891 3.54601C11.9309 3.62421 11.9633 3.73631 11.9812 3.95552C11.9996 4.18056 12 4.47171 12 4.9V5.5C12 5.77614 12.2239 6 12.5 6C12.7761 6 13 5.77614 13 5.5V4.87935V4.87934C13 4.47686 13 4.14468 12.9779 3.87409C12.9549 3.59304 12.9057 3.33469 12.782 3.09202C12.5903 2.7157 12.2843 2.40973 11.908 2.21799C11.6653 2.09434 11.407 2.04506 11.1259 2.0221C10.8553 1.99999 10.5231 1.99999 10.1206 2L10.1 2H9.5C9.22386 2 9 2.22386 9 2.5C9 2.77614 9.22386 3 9.5 3H10.1Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              <span
                className="flex-1 capitalize text-xs line-clamp-2"
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
    case 'dimensionPicker':
      const dimensionValue = value as DimensionValue;
      let dimensionValueAsTitle = '';

      if(item.config?.hideWidth) {
        dimensionValueAsTitle = `${dimensionValue.height}`;
      } else if(item.config?.hideHeight) {
        dimensionValueAsTitle = `${dimensionValue.width}`;
      } else {
        dimensionValueAsTitle = `${dimensionValue.width} x ${dimensionValue.height}`;
      }

      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <Ruler className="size-5 border border-gray-200 rounded p-0.5" />
              <span
                className="flex-1 text-xs line-clamp-2"
                title={dimensionValueAsTitle}
              >
                {dimensionValueAsTitle}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="justify-center">
            <DimensionPicker
              className="w-full max-w-[300px]"
              value={dimensionValue}
              onChange={(value) => onChange(item.name, value as DimensionValue)}
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
              <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1C0.447715 1 0 1.44772 0 2V13C0 13.5523 0.447715 14 1 14H14C14.5523 14 15 13.5523 15 13V2C15 1.44772 14.5523 1 14 1H1ZM7.5 10.625C9.22589 10.625 10.625 9.22589 10.625 7.5C10.625 5.77411 9.22589 4.375 7.5 4.375C5.77411 4.375 4.375 5.77411 4.375 7.5C4.375 9.22589 5.77411 10.625 7.5 10.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
              <span
                className="flex-1 text-xs line-clamp-2"
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
    case 'imagePicker':
      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <Image className="size-4" />
              <span
                className="flex-1 text-xs line-clamp-2 break-all"
              >
                {value !== '' ? value : 'Select image'}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="justify-center">
            <ImageUpload
              className="w-full w-[250px] cursor-pointer"
              onChange={(value) => onChange(item.name, value?.url)} preview={value?.url}
              label="Upload an image"
            />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case 'fontFamilyPicker':
      return (
        <Select value={value as string} onValueChange={(value) => onChange(item.name, value)}>
          <SelectTrigger className="flex-1 h-fit p-0 shadow-none border-none w-fit cursor-pointer"  style={{ fontFamily: value }}>
            <SelectValue placeholder={item.defaultValue}/>
          </SelectTrigger>
          <SelectContent>
            {fonts?.map((font) => (
              <SelectItem key={font.name} value={font.name} style={{ fontFamily: font.name }}>
                {font.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'spacingPicker':
      return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 0.75L9.75 3H5.25L7.5 0.75ZM7.5 14.25L9.75 12H5.25L7.5 14.25ZM3 5.25L0.75 7.5L3 9.75V5.25ZM14.25 7.5L12 5.25V9.75L14.25 7.5Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              <span
                className="flex-1 text-xs line-clamp-2"
                title={value}
              >
                {value}
              </span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="justify-center">
            <SpacingPicker
              className="w-full max-w-[300px] p-2"
              value={value as string}
              defaultValue={item.defaultValue}
              defaultThemeKey={item.name}
              onChangeProperty={(value) => onChange(item.name, value)}
              config={item.config}
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
            <SelectContent className="w-fit">
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
    //   sizepicker?
    default:
      return <span className="text-sm">{item.value}</span>;
  }
  // padding: 0, padding: 12px (normal)
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

  const handleChange = (value: string) => {
    onChange(value, items.find((item) => item.name === value)?.defaultValue);
  };

  return (
    <div className="flex flex-col gap-2 p-2 border rounded-md border-gray-200 bg-gray-100/50 h-full">
      {itemsWithValue?.map((item) => (
        <div key={item.name} className="px-2 py-1.5 flex flex-row gap-2 items-center bg-white rounded-md border border-gray-200">
          {item.tooltip && (
            <TooltipProvider delayDuration={1500}>
              <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 cursor-help text-gray-500 hover:text-gray-700 hover:scale-110 transition-all duration-300 ease-in-out" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="center"
                    className="max-w-[200px]"
                  >
                      {item.tooltip}
                  </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Label className={cn(item.tooltip && '!w-26', "text-sm w-32 text-xs")}>{item.label}</Label>
          <Separator orientation="vertical" className="!h-5" />
          <div className="flex-1 flex flex-row gap-2 items-center justify-between">
            <StyleItemValuePreview item={item} onChange={onChange} themeColors={themeColors} fonts={fonts} />
            {onDelete &&
              <Kebab
                items={[
                    {
                      label: 'Delete',
                      onClick: () => onDelete?.(item.name)
                    }
                  ]}
              />
            }
          </div>
        </div>
      ))}

      {itemsWithoutValue.length > 0 && (
        <Combobox
          items={itemsWithoutValue.map((item) => ({
            value: item.name,
            label: item.label
          }))}
          selected={''}
          onSelect={(selected) => handleChange(selected as string)}
          placeholderIcon={<PlusIcon className="w-4 h-4" />}
          placeholder={itemsWithValue.length > 0 ? 'Add another style' : 'Add a style'}
          hideSearch={itemsWithoutValue.length === 0}
          disabled={itemsWithoutValue.length === 0}
          hideChevron
        />
      )}
    </div>
  );
};
