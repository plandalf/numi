import React from 'react';
import { Label } from '../ui/label';
import { ColorPicker } from '../ui/color-picker';

interface ColorPickerEditorProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
}

export const ColorPickerEditor: React.FC<ColorPickerEditorProps> = ({ label, value, onChange }) => (
  <div className="flex flex-col gap-3">
    <Label className="text-sm capitalize">{label}</Label>
    <ColorPicker value={value} onChange={onChange} />
  </div>
); 