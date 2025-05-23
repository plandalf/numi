import React, { useState } from 'react';
import { Label } from '../ui/label';
import ShadowPicker, { parseShadow } from '../ui/shadow-picker';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface ShadowPickerEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  themeColors?: Record<string, string>;
}

export const ShadowPickerEditor: React.FC<ShadowPickerEditorProps> = ({ label, value, onChange, themeColors }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="mb-1 block text-sm capitalize">{label}</Label>
      <div className={cn('flex gap-1 justify-between')}>
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <span className="border border-gray-200 rounded-md p-2 flex-1 flex flex-row gap-2 items-center cursor-pointer">
              <svg width="20" height="20" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M1 1C0.447715 1 0 1.44772 0 2V13C0 13.5523 0.447715 14 1 14H14C14.5523 14 15 13.5523 15 13V2C15 1.44772 14.5523 1 14 1H1ZM7.5 10.625C9.22589 10.625 10.625 9.22589 10.625 7.5C10.625 5.77411 9.22589 4.375 7.5 4.375C5.77411 4.375 4.375 5.77411 4.375 7.5C4.375 9.22589 5.77411 10.625 7.5 10.625Z" fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path></svg>
              <span
                className="text-sm truncate"
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
              onChange={(value) => onChange(value)}
              onClose={() => setIsOpen(false)}
              themeColors={themeColors}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}; 