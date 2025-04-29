import React from 'react';
import { Label } from '../ui/label';
import ShadowPicker from '../ui/shadow-picker';

interface ShadowPickerEditorProps {
  label: string;
  value: {
    borderX?: string;
    borderY?: string;
    borderBlur?: string;
    borderSpread?: string;
  };
  onChange: (val: any) => void;
}

export const ShadowPickerEditor: React.FC<ShadowPickerEditorProps> = ({ label, value, onChange }) => {
  const safeValue = {
    borderX: value.borderX ?? '2',
    borderY: value.borderY ?? '2',
    borderBlur: value.borderBlur ?? '2',
    borderSpread: value.borderSpread ?? '2',
  };
  return (
    <div className="flex flex-col gap-1.5 mb-3">
      <Label className="mb-1 block">{label}</Label>
      <ShadowPicker value={safeValue} onChange={onChange} />
    </div>
  );
}; 