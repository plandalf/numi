import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

interface MapFieldProps {
  value: Record<string, string> | null;
  onChange: (value: Record<string, string>) => void;
  emptyText?: string;
  addButtonText?: string;
}

export function MapField({ 
  value, 
  onChange, 
  emptyText = "No entries yet. Click the button above to add one.",
  addButtonText = "Add Entry"
}: MapFieldProps) {
  // Convert object to array of [key, value] pairs for rendering
  const entries = value ? Object.entries(value) : [];

  const handleChange = (newEntries: [string, string][]) => {
    // Convert back to object, filtering out empty keys
    const newValue: Record<string, string> = {};
    newEntries.forEach(([key, val]) => {
      if (key.trim()) {
        newValue[key.trim()] = val;
      }
    });
    onChange(newValue);
  };

  const addEntry = () => {
    handleChange([...entries, ['', '']]);
  };

  const updateKey = (index: number, newKey: string) => {
    const newEntries = [...entries];
    newEntries[index] = [newKey, newEntries[index][1]];
    handleChange(newEntries);
  };

  const updateValue = (index: number, newValue: string) => {
    const newEntries = [...entries];
    newEntries[index] = [newEntries[index][0], newValue];
    handleChange(newEntries);
  };

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    handleChange(newEntries);
  };

  return (
    <div className="space-y-3">
      {entries.length > 0 && (
        <div className="space-y-2">
          {entries.map(([key, val], index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                placeholder="Key"
                value={key}
                onChange={(e) => updateKey(index, e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Value"
                value={val}
                onChange={(e) => updateValue(index, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeEntry(index)}
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addEntry}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        {addButtonText}
      </Button>
      
      {entries.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">
          {emptyText}
        </p>
      )}
    </div>
  );
} 