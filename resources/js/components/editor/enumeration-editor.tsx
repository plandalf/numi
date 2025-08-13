import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { CardIconPanel } from '../ui/card-icon-panel';

interface EnumerationEditorProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  icons?: Record<string, string | React.ReactNode>;
  labels?: Record<string, string>;
  inspector?: string;
}

export const EnumerationEditor: React.FC<EnumerationEditorProps> = ({ label, placeholder = 'Select an option', value, onChange, options, icons, labels, inspector }) => (
  <div className="flex flex-col gap-2">
    {label && <Label className="text-sm">{label}</Label>}
    {inspector && inspector === 'card' ? (
      <CardIconPanel
        options={options}
        value={value}
        onChange={onChange}
        icons={icons}
        labels={labels}
      />
    ) : (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-white">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.filter(option => option !== '').map(option => (
            <SelectItem key={option} value={option}>
              {labels?.[option] ?? option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  </div>
); 