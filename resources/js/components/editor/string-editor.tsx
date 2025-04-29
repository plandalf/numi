import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import React from 'react';

interface StringEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}

export const StringEditor: React.FC<StringEditorProps> = ({ label, placeholder, value, onChange, multiline }) => (
  <div className="flex flex-col gap-2 mb-3">
    <Label className="text-sm capitalize">{label}</Label>
    {multiline ? (
      <Textarea 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        rows={5}
        placeholder={placeholder}
      />
    ) : (
      <input
        type="text"
        className="border border-gray-300 rounded-md p-1.5 w-full text-sm"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    )}
  </div>
); 