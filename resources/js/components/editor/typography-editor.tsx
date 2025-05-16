import { Input } from '../ui/input';
import { Label } from '../ui/label';
import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Font } from '@/types';
import { WEIGHT_LABELS } from '../ui/font-picker';
interface TypographyEditorProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  fonts: Font[];
}

export const TypographyEditor: React.FC<TypographyEditorProps> = ({ label, value, onChange, fonts }) => {
  const [size = '', font = '', weight = ''] = value || [];
  
  const selectedFont = fonts.find(f => f.name === font);
  const availableWeights = selectedFont?.weights || [];

  const handleFontChange = (newFont: string) => {
    const newSelectedFont = fonts.find(f => f.name === newFont);
    const newAvailableWeights = newSelectedFont?.weights || [];
    
    // If current weight is not in the new font's weights, default to Regular (400)
    const newWeight = newAvailableWeights.includes(weight) ? weight : '400';
    onChange([size, newFont, newWeight]);
  };

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
        <Select value={font} onValueChange={handleFontChange}>
          <SelectTrigger className="w-1/3 text-xs truncate" style={{ fontFamily: font }}>
            <SelectValue placeholder="Font" />
          </SelectTrigger>
          <SelectContent>
            {fonts.map(f => (
              <SelectItem className="text-xs truncate" key={f.name} value={f.name} style={{ fontFamily: f.name }}>
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select 
          value={weight} 
          onValueChange={w => onChange([size, font, w])}
          disabled={!selectedFont}
        >
          <SelectTrigger className="w-1/3 text-xs truncate">
            <SelectValue placeholder="Weight" />
          </SelectTrigger>
          <SelectContent>
            {availableWeights.map(w => (
              <SelectItem className="text-xs truncate" key={w} value={w}>
                {WEIGHT_LABELS[w] || w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}