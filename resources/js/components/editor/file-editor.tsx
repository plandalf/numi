import React from 'react';
import { Label } from '../ui/label';
import { ImageUpload } from '../ui/image-upload';

interface FileEditorProps {
  label: string;
  value: any;
  onChange: (media: any) => void;
  preview?: string;
}

export const FileEditor: React.FC<FileEditorProps> = ({ label, value, onChange, preview }) => (
  <div className="flex flex-col gap-2">
    <Label className="text-sm capitalize">{label}</Label>
    <ImageUpload value={value} onChange={(data) => onChange(data?.url)} preview={preview} />
  </div>
);
