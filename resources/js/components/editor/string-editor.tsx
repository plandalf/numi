import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import React from 'react';

interface StringEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}

export const StringEditor: React.FC<StringEditorProps> = ({ label, value, onChange, multiline }) => (
  <div className="flex flex-col gap-2 mb-3">
    <Label>{label}</Label>
    {multiline ? (
      <Textarea value={value} onChange={e => onChange(e.target.value)} />
    ) : (
      <input
        type="text"
        className="border border-gray-300 rounded-md p-1 w-full"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    )}
  </div>
); 