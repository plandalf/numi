import React from 'react';
import { Label } from '../ui/label';
import ShadowPicker from '../ui/shadow-picker';

interface ShadowPickerEditorProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
}

export const ShadowPickerEditor: React.FC<ShadowPickerEditorProps> = ({ label, value, onChange }) => {
  const safeValue = value || '0px 0px 0px 0px #000000';

  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <Label className="mb-1 block text-sm capitalize">{label}</Label>
      <ShadowPicker value={safeValue} onChange={onChange} />
    </div>
  );
}; 