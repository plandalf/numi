import { useEditor } from "@/contexts/offer/editor-context";
import { getThemeColors } from "./page-theme";
import { StyleEditor, type StyleItem } from "../editor/style-editor";
import { Appearance, Style } from '@/contexts/Numi';
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SectionInspectorProps {
  sectionId: string;
  onClose?: () => void;
}

export function SectionInspector({ sectionId /*, onClose */ }: SectionInspectorProps) {
  const { data, selectedPage, updateSection } = useEditor();
  const page = data.view.pages[selectedPage];
  const section = page.view[sectionId];

  if (!section) return null;
  const themeColors = getThemeColors(data.theme);

  const handleStyleChange = (key: string, value: string | boolean) => {
    updateSection(sectionId, {
      ...section,
      style: {
        ...section.style,
        [key]: value
      }
    });
  };

  const handleStyleDelete = (key: string) => {
    const newStyle = { ...section.style };
    delete newStyle[key];
    updateSection(sectionId, {
      ...section,
      style: newStyle
    });
  };

  const styleItems: StyleItem[] = [
    Style.backgroundColor('backgroundColor', 'Background Color', {}, '#FFFFFF'),
  ].map(style => ({
    name: style.type,
    label: style.label,
    value: section.style?.[style.type],
    defaultValue: style.defaultValue,
    inspector: style.inspector as StyleItem['inspector'],
    options: style.options
  }));


  const appearanceItems = [
    Appearance.padding(),
    Appearance.spacing(), // default = theme.padding
  ];
  // apply appearance values?


  function handleAppearanceChange(key: string, value: string | null) {
    updateSection(sectionId, {
      ...section,
      appearance: {
        ...section.style,
        [key]: value
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-3 mb-6 overflow-y-auto p-4">
        <h3 className="font-semibold">Appearance</h3>

        <AppearanceEditor
          items={appearanceItems}
          values={section.appearance || {}}
          onChange={handleAppearanceChange}
        />

        <h3 className="font-semibold">Styles</h3>
        {/*<Label className="text-sm">Styles</Label>*/}
          <StyleEditor
            items={styleItems}
            onChange={handleStyleChange}
            onDelete={handleStyleDelete}
            themeColors={themeColors}
          />
        </div>
    </div>
  );
}

interface AppearanceEditorProps {
  items: ReturnType<typeof Appearance.padding>[];
  values: Record<string, string | null>;
  onChange: (key: string, value: string | null) => void;
}

// New component for individual appearance properties
interface AppearancePropertyItemProps {
  item: ReturnType<typeof Appearance.padding>;
  currentValue: string | null;
  onChangeProperty: (value: string | null) => void;
}

function AppearancePropertyItem({ item, currentValue, onChangeProperty }: AppearancePropertyItemProps) {
  const [isCustomEditing, setIsCustomEditing] = useState(false);
  // Initialize customInputValue with currentValue if it's a custom value, otherwise empty.
  // This helps pre-fill the input if a custom value was already set.
  const initialCustomValue = (currentValue && currentValue !== 'default' && currentValue !== null) ? currentValue : '';
  const [customInputValue, setCustomInputValue] = useState<string>(initialCustomValue);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleFnClick = () => {
    if (isCustomEditing) {
      // Deactivating custom editing: revert to normal, clear error
      setIsCustomEditing(false);
      onChangeProperty('default');
      setValidationError(null);
      setCustomInputValue(''); // Reset input field
    } else {
      // Activating custom editing
      setIsCustomEditing(true);
      // If current value is 'default' or 'none', input starts empty or with placeholder
      // Otherwise, if it's a specific px value, prefill the input.
      const valueToEdit = (currentValue && currentValue !== 'default' && currentValue !== null) ? currentValue : '';
      setCustomInputValue(valueToEdit);
      // Do not call onChangeProperty here, let typing or blur handle it.
    }
  };

  const handleTabChange = (tabValue: string) => {
    setIsCustomEditing(false);
    setValidationError(null);
    if (tabValue === 'none') {
      onChangeProperty(null);
      setCustomInputValue('');
    } else { // 'normal' tab
      onChangeProperty('default');
      setCustomInputValue('');
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setCustomInputValue(newValue);
    onChangeProperty(newValue); // Live update
    // Clear error as user types, validation happens on blur
    if (validationError) {
      setValidationError(null);
    }
  };

  const handleCustomInputBlur = () => {
    if (!customInputValue && isCustomEditing) { // If input is empty on blur while editing, treat as no custom value
        setValidationError(null); // No error for empty, it's not an *invalid format*
        // onChangeProperty(null); // Or revert to default? For now, live update has sent empty string. User can use Fn to revert.
        return;
    }
    if (customInputValue && (!/^\d+px$/.test(customInputValue) || parseInt(customInputValue, 10) <= 0)) {
      setValidationError('Must be a positive pixel value (e.g., 10px).');
    } else {
      setValidationError(null);
      // onChangeProperty(customInputValue); // Value already sent by live update
    }
  };

  const activeTab = currentValue === null ? 'none' : 'normal';

  // If custom editing is active, don't show tabs as active.
  // Tabs only reflect 'default' or 'none'.
  const currentTabState = isCustomEditing ? undefined : activeTab;

  return (
    <div key={item.type} className="flex flex-col gap-2">
      <Label htmlFor={`${item.type}-input`} className="text-sm font-medium">{item.label}</Label>
      <div className="flex items-center gap-2">
        <Button
          onClick={handleFnClick}
          variant={isCustomEditing ? "secondary" : "ghost"} // Visually indicate active state
          size="xs"
          aria-label={`Toggle custom ${item.label}`}
          aria-pressed={isCustomEditing}
        >
          Fn
        </Button>
        {isCustomEditing ? (
          <Input
            type="text"
            id={`${item.type}-input`}
            value={customInputValue}
            onChange={handleCustomInputChange}
            onBlur={handleCustomInputBlur}
            placeholder="e.g., 10px"
            className={`flex-grow ${validationError ? 'border-red-500' : ''}`}
          />
        ) : (
          <Tabs value={currentTabState} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="normal">Normal</TabsTrigger>
              <TabsTrigger value="none">None</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>
      {validationError && isCustomEditing && (
        <p className="text-xs text-red-600 mt-1">{validationError}</p>
      )}
      {item.type === 'spacing' && !isCustomEditing && currentValue === 'default' && (
         <p className="text-xs text-muted-foreground">Default: {item.defaultValue || 'Theme default'}</p>
      )}
       {item.type === 'spacing' && isCustomEditing && !validationError && (
         <p className="text-xs text-muted-foreground">Enter px value. Default: {item.defaultValue || 'Theme default'}</p>
      )}
    </div>
  );
}

function AppearanceEditor({ items, values, onChange }: AppearanceEditorProps) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <AppearancePropertyItem
          key={item.type}
          item={item}
          currentValue={values[item.type] === undefined ? 'default' : values[item.type]}
          onChangeProperty={(newValue) => onChange(item.type, newValue)}
        />
      ))}
    </div>
  );
}
