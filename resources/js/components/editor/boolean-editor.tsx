import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import React from 'react';

interface BooleanEditorProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const BooleanEditor: React.FC<BooleanEditorProps> = ({ label, value, onChange }) => (
  <div className="flex items-center gap-2 mb-3">
    <Checkbox checked={value} onCheckedChange={onChange} />
    <Label className="mb-0">{label}</Label>
  </div>
); 