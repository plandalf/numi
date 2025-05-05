import React from 'react';
import { Label } from '../ui/label';
import AlignmentPicker from '../ui/alignment-picker';

interface AlignmentPickerEditorProps {
  label: string;
  value: string;
  onChange: (alignment: string) => void;
}

export const AlignmentPickerEditor: React.FC<AlignmentPickerEditorProps> = ({ label, value, onChange }) => (
  <div className="flex flex-row gap-3 items-center justify-between">
    <Label className="text-sm capitalize">{label}</Label>
    <AlignmentPicker value={value} onChange={onChange} />
  </div>
); 