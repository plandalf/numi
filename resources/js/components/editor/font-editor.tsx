import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Font } from '@/types';

interface FontEditorProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  fonts: Font[];
  icons?: Record<string, string | React.ReactNode>;
  labels?: Record<string, string>;
  inspector?: string;
}

export const FontEditor: React.FC<FontEditorProps> = ({ label, placeholder = 'Select a font', value, onChange, fonts, icons, labels, inspector }) => {

  return (
    <div className="flex flex-col gap-3">
      {label && <Label className="text-sm">{label}</Label>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="truncate" style={{ fontFamily: value }}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {fonts.map(f => (
            <SelectItem className="truncate" key={f.name} value={f.name} style={{ fontFamily: f.name }}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};