import { Input } from '../ui/input';
import { Label } from '../ui/label';
import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';

interface TypographyEditorProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  fonts: string[];
  weights: string[];
}

export const TypographyEditor: React.FC<TypographyEditorProps> = ({ label, value, onChange, fonts, weights }) => {
  const [size = '', font = '', weight = ''] = value || [];
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm capitalize">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={size}
          onChange={e => onChange([e.target.value, font, weight])}
          placeholder="Size (e.g. 16px)"
          className="w-1/3 text-xs truncate"
        />
        <Select value={font} onValueChange={f => onChange([size, f, weight])}>
          <SelectTrigger className="w-1/3 text-xs truncate">
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map(f => (
              <SelectItem className="text-xs truncate" key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={weight} onValueChange={w => onChange([size, font, w])}>
          <SelectTrigger className="w-1/3 text-xs truncate">
            <SelectValue placeholder="Weight" />
          </SelectTrigger>
          <SelectContent>
            {weights.map(w => (
              <SelectItem className="text-xs truncate" key={w} value={w}>{w}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}