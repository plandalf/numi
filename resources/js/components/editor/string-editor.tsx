import { cn, isValidUrl } from '@/lib/utils';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import React, { useState } from 'react';

interface StringEditorProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hidden?: boolean;
  validations?: ('url' | string)[];
}

export const StringEditor: React.FC<StringEditorProps> = ({ label, placeholder, value, onChange, multiline, hidden, validations }) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError(null);
    
    const newValue = e.target.value;
    onChange(newValue);
  }

  const validate = (value: string) => {
    if (validations?.length) {
      for (const validation of validations) {
        if (validation === 'url' && !isValidUrl(value)) {
          setError('Invalid URL');
          return false;
        }
      }
    }
    return true;
  }
  
  return (
    <div className="flex flex-col gap-2">
      {label && <Label className="text-sm capitalize">{label}</Label>}
      {multiline ? (
      <Textarea
        className="bg-white"
        value={value}
        onChange={e => handleChange(e)}
        rows={5}
        placeholder={placeholder}
        onBlur={() => validate(value)}
      />
    ) : (
      <input
        type="text"
        className="bg-white border border-gray-300 rounded-md p-1.75 w-full text-sm"
        value={value}
        onChange={e => handleChange(e)}
        placeholder={placeholder}
        onBlur={() => validate(value)}
      />
    )}
    {error && <p className="text-red-500 text-xs">{error}</p>}
  </div>
  )
};