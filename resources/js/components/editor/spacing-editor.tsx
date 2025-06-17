import { Label } from "../ui/label";
import { SpacingPicker, SpacingPickerConfig } from "../ui/spacing-picker";

export interface SpacingEditorProps {
  label?: string;
  value: string | null;
  defaultValue?: string | null;
  defaultThemeKey?: string;
  onChangeProperty: (value: string | null) => void;
  config?: SpacingPickerConfig;
}

export function SpacingEditor({
  label,
  value,
  defaultValue,
  defaultThemeKey,
  onChangeProperty,
  config
}: SpacingEditorProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-24">
        <Label htmlFor={`${label}-input`} className="mb-1 block text-sm capitalize">{label}</Label>
      </div>
      <div className="flex-grow">
        <SpacingPicker
          id={`${label}-input`}
          value={value}
          defaultValue={defaultValue ?? ''}
          defaultThemeKey={defaultThemeKey}
          onChangeProperty={onChangeProperty}
          config={config}
        />
      </div>
    </div>
  );
}
