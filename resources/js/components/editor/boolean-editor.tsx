import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import React from 'react';

interface BooleanEditorProps {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export const BooleanEditor: React.FC<BooleanEditorProps> = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between gap-3 border rounded-md px-4 py-2 bg-white">
    <Label className="mb-0 text-sm">{label}</Label>
    <Switch checked={value} onCheckedChange={onChange} />
  </div>
);