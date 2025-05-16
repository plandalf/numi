import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import React from 'react';

interface StringEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hidden?: boolean;
}

export const StringEditor: React.FC<StringEditorProps> = ({ label, placeholder, value, onChange, multiline }) => (
  <div className="flex flex-col gap-2">
    {label && <Label className="text-sm capitalize">{label}</Label>}
    {multiline ? (
      <Textarea
        className="bg-white"
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={5}
        placeholder={placeholder}
      />
    ) : (
      <input
        type="text"
        className="bg-white border border-gray-300 rounded-md p-1.75 w-full text-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
);