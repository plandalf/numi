import { cn, isValidUrl } from '@/lib/utils';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import React, { useEffect, useMemo, useState } from 'react';
import { MarkdownIcon } from '../blocks/MarkdownIcon';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip';
import { ExternalLinkIcon } from 'lucide-react';

interface StringEditorProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  hidden?: boolean;
  validations?: ('url' | string)[];
  defaultValue?: string;
}

export const StringEditor: React.FC<StringEditorProps> = ({ label, placeholder, value: initialValue, onChange, multiline, hidden, validations, defaultValue }) => {
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setError(null);

    const newValue = e.target.value;
    onChange(newValue);
  }

  const validate = (value?: string) => {
    if (validations?.length) {
      for (const validation of validations) {
        if (validation === 'url' && value && !isValidUrl(value)) {
          setError('Invalid URL');
          return false;
        }

        if (validation === 'required' && !value) {
          setError('This field is required');
          return false;
        }
      }
    }
    return true;
  }

  const value = useMemo(() => {
    if(typeof initialValue === 'undefined') {
      return defaultValue;
    }

    return initialValue;
  }, [initialValue, defaultValue]);

  return (
    <div className="flex flex-col gap-2">
      {label && <Label className="text-sm capitalize flex items-center justify-between">
        {label}
        {multiline && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span><MarkdownIcon className="w-5 h-5 text-gray-500 cursor-help" /></span>
            </TooltipTrigger>
            <TooltipContent side="right" align="center" className="max-w-xs">
              <div>
                <strong>Supports Markdown formatting.</strong>
                <hr/>
                <a href='https://www.plandalf.dev/docs/markdown-blocks' className='text-blue-300 underline' target='_blank' rel='noopener noreferrer'>Read about markdown blocks <ExternalLinkIcon className="w-4 h-4 inline-block" /></a>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </Label>}
      {multiline ? (
      <Textarea
        className="!min-h-16 bg-white"
        value={value}
        onChange={e => handleChange(e)}
        rows={2}
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