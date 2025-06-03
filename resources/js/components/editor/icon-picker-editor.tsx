import React, { useMemo, useState } from 'react';
import { Label } from '../ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Image, X } from 'lucide-react';
import IconPicker from '../ui/icon-picker';
import { IconValue } from '@/contexts/Numi';
import { cn } from '@/lib/utils';
import { cx } from 'class-variance-authority';
import * as LucideIcons from 'lucide-react';

interface IconPickerEditorProps {
  label: string;
  value: IconValue;
  onChange: (icon: IconValue) => void;
}

export const IconPickerEditor: React.FC<IconPickerEditorProps> = ({ label, value, onChange }) => {

  const [isOpen, setIsOpen] = useState(false);
  const previewValue = value?.icon ?? value?.emoji ?? value?.url;

  const title = useMemo(() => {
    if (value?.icon) {
      const Component = LucideIcons[value.icon as keyof typeof LucideIcons];

      return (
        <div className="flex flex-row items-center gap-2">
          <Component className="size-4" />
          <span className="text-sm truncate">
            {value.icon} Icon
          </span>
        </div>
      )
    }

    if(value?.emoji) {
      return (
        <div className="flex flex-row items-center gap-2">
          {value.emoji}
          <span className="text-sm truncate">
            Emoji
          </span>
        </div>
      )
    }

    if (value?.url) {
      return 'Click to view uploaded image';
    }

    return 'Select an Icon';
  }, [previewValue]);

  return (
    <div className="flex flex-col gap-3">
      <Label className="text-sm capitalize">{label}</Label>
      <div className="flex flex-row gap-2">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                'flex flex-row items-center gap-2 bg-white',
                'items-start px-4 group relative h-9',
                'w-full overflow-hidden rounded-lg shadow-none',
                'border border-gray-200 cursor-pointer',
                previewValue ? 'justify-between' : 'justify-start'
              )}
            >
              <div className="w-full flex flex-row items-center gap-2 self-center">
                <Image className="size-4" />
                <span
                  className={cn(
                    'text-sm truncate',
                    previewValue ? 'w-50' : 'w-58'
                  )}
                >
                  {title}
                </span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="justify-center">
            <IconPicker
              value={value}
              onChange={onChange}
              className="w-[350px]"
              onClose={() => setIsOpen(false)}
            />
          </DropdownMenuContent>
        </DropdownMenu>
        {previewValue && (
          <X
            className={cx(
              'size-4 self-center hover:cursor-pointer hover:text-white',
              'hover:bg-red-500 p-0.5 rounded-full text-gray-500 hover:text-gray-700',
              'cursor-pointer mr-2 transition-all duration-200'
            )}
            onClick={() =>
              onChange({ icon: undefined, emoji: undefined, url: undefined })
            }
          />
        )}
      </div>
    </div>
  );
};
