import React from 'react';
import { Button } from '../ui/button';
import { PlusIcon } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { AdvancedColorPicker, ColorPicker, parseHexAlpha } from '../ui/color-picker';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import AlignmentPicker, { alignmentIcons } from '../ui/alignment-picker';
import { Kebab } from '../ui/kebab';
import { Checkbox } from '../ui/checkbox';

export interface StyleItem {
  name: string;
  label: string;
  value?: string | boolean;
  defaultValue: string | boolean;
  inspector: 'colorPicker' | 'alignmentPicker' | 'select' | 'checkbox';
  options?: Record<string, string>;
}

interface StyleEditorProps {
  items: StyleItem[];
  onChange: (key: string, value: string | boolean) => void;
  onDelete: (key: string) => void;
  themeColors?: Record<string, string>;
}

const StyleItemValuePreview = (
  { item, onChange, themeColors }: { item: StyleItem; onChange: (key: string, value: string | boolean) => void, themeColors?: Record<string, string> }) => {
  
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <span className="flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <span className="bg-gray-200 rounded p-0.5">
                {alignmentIcons[value as keyof typeof alignmentIcons]}
                </span>
              <span className="text-xs capitalize">{value}</span>
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[200px]">
            <AlignmentPicker
              value={value as string}
              onChange={(value) => onChange(item.name, value)}
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
            <StyleItemValuePreview item={item} onChange={onChange} themeColors={themeColors} />
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