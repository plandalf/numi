import { Label } from "../ui/label";
import { SpacingPicker, SpacingPickerConfig } from "../ui/spacing-picker";

export interface SpacingEditorProps {
  label?: string;
  value: string | null;
  defaultValue?: string | null;
  onChangeProperty: (value: string | null) => void;
  config?: SpacingPickerConfig;
}

export function SpacingEditor({ 
  label,
  value,
  defaultValue,
  onChangeProperty,
  config
}: SpacingEditorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`${label}-input`} className="mb-1 block text-sm capitalize">{label}</Label>
      <SpacingPicker
        id={`${label}-input`}
        value={value}
        defaultValue={defaultValue ?? ''}
        onChangeProperty={onChangeProperty}
        config={config}
      />
    </div>
  );
}