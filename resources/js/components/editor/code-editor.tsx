import React, { useMemo, useState } from 'react';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Maximize2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import CodeMirror from '@uiw/react-codemirror';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';

interface CodeEditorProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  language?: string; // Placeholder for future syntax highlighting
  defaultValue?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ label, value: initialValue, onChange, placeholder, defaultValue }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string>(initialValue ?? defaultValue ?? '');

  const value = useMemo(() => {
    return typeof initialValue === 'undefined' ? (defaultValue ?? '') : (initialValue ?? '');
  }, [initialValue, defaultValue]);

  const handleOpen = () => {
    setDraft(value);
    setOpen(true);
  };

  const handleSave = () => {
    onChange(draft);
    setOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-sm capitalize">{label}</Label>
          <Button type="button" variant="outline" size="sm" onClick={handleOpen} className="h-7 px-2 gap-1">
            <Maximize2 className="w-3.5 h-3.5" />
            Edit
          </Button>
        </div>
      )}

      {/* Inline compact editor as textarea */}
      <Textarea
        className="font-mono bg-white min-h-24"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={6}
      />

      {/* Pop-out dialog editor */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{label || 'Edit code'}</DialogTitle>
            <DialogDescription>Use this editor for large HTML or code content.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <CodeMirror
              value={draft}
              height="60vh"
              theme={oneDark}
              extensions={[html({ autoCloseTags: true, matchClosingTags: true })]}
              onChange={(v) => setDraft(v)}
              basicSetup={{ lineNumbers: true, highlightActiveLine: true, autocompletion: false }}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="button" onClick={handleSave}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodeEditor;


