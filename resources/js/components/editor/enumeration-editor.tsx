import React, { useMemo, useState } from 'react';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { CardIconPanel } from '../ui/card-icon-panel';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

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

export const EnumerationEditor: React.FC<EnumerationEditorProps> = ({ label, placeholder = 'Select an option', value, onChange, options, icons, labels, inspector }) => {
  const isTemplate = useMemo(() => typeof value === 'string' && /\{\{.*\}\}/.test(value), [value]);
  const [fnMode, setFnMode] = useState<boolean>(isTemplate);

  const toggleFn = () => {
    setFnMode(prev => !prev);
  };

  return (
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
        <div className="flex items-center gap-2">
          <Button type="button" size="xs" variant={fnMode ? 'default' : 'ghost'} onClick={toggleFn} className="rounded-md">
            Fn
          </Button>
          {fnMode ? (
            <Input
              value={value ?? ''}
              onChange={e => onChange(e.target.value)}
              placeholder={"e.g., {{ checkout.items[0].renew_interval }}"}
            />
          ) : (
            <Select value={typeof value === 'string' ? value : ''} onValueChange={onChange}>
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
      )}
    </div>
  );
};