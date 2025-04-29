import React from 'react';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { IconPanel } from '../ui/icon-panel';

interface EnumerationEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  icons?: Record<string, string | React.ReactNode>;
  labels?: Record<string, string>;
}

export const EnumerationEditor: React.FC<EnumerationEditorProps> = ({ label, value, onChange, options, icons, labels }) => (
  <div className="flex flex-col gap-3 mb-3">
    <Label>{label}</Label>
    {icons && typeof icons === 'object' ? (
      <IconPanel
        options={options}
        value={value}
        onChange={onChange}
        icons={icons}
        labels={labels}
      />
    ) : (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {labels?.[option] ?? option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )}
  </div>
); 