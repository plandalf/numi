import React from 'react';
import { Label } from '../ui/label';
import { ColorPicker, ColorPickerProps } from '../ui/color-picker';

interface ColorPickerEditorProps extends ColorPickerProps {
  label: string;
}

export const ColorPickerEditor: React.FC<ColorPickerEditorProps> = ({ label, value, onChange, type, themeColors }) => (
  <div className="flex flex-col gap-2">
    <Label className="text-sm capitalize">{label}</Label>
    <ColorPicker value={value} onChange={onChange} type={type} themeColors={themeColors} />
  </div>
); 