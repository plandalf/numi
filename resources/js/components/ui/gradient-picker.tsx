import React, { useState } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { ColorPicker } from './color-picker';
import { Plus, X } from 'lucide-react';

export interface GradientStop {
  id: string;
  color: string;
  position: number;
}

export interface GradientValue {
  type: 'linear' | 'radial';
  direction?: string;
  center?: string;
  stops: GradientStop[];
}

interface GradientPickerProps {
  value: GradientValue;
  onChange: (value: GradientValue) => void;
  themeColors?: Record<string, { value: string, label: string }>;
}

const LINEAR_DIRECTIONS = [
  { value: 'to right', label: 'To Right' },
  { value: 'to left', label: 'To Left' },
  { value: 'to bottom', label: 'To Bottom' },
  { value: 'to top', label: 'To Top' },
  { value: 'to bottom right', label: 'To Bottom Right' },
  { value: 'to bottom left', label: 'To Bottom Left' },
  { value: 'to top right', label: 'To Top Right' },
  { value: 'to top left', label: 'To Top Left' },
];

const RADIAL_CENTERS = [
  { value: 'center', label: 'Center' },
  { value: 'top left', label: 'Top Left' },
  { value: 'top right', label: 'Top Right' },
  { value: 'bottom left', label: 'Bottom Left' },
  { value: 'bottom right', label: 'Bottom Right' },
];

export const GradientPicker: React.FC<GradientPickerProps> = ({
  value,
  onChange,
  themeColors
}) => {
  const [localValue, setLocalValue] = useState<GradientValue>(value);

  const updateGradient = (updates: Partial<GradientValue>) => {
    const newValue = { ...localValue, ...updates };
    setLocalValue(newValue);
    onChange(newValue);
  };

  const addStop = () => {
    const newStop: GradientStop = {
      id: Math.random().toString(36).substr(2, 9),
      color: '#000000',
      position: 50
    };
    updateGradient({
      stops: [...localValue.stops, newStop]
    });
  };

  const removeStop = (id: string) => {
    if (localValue.stops.length > 2) {
      updateGradient({
        stops: localValue.stops.filter(stop => stop.id !== id)
      });
    }
  };

  const updateStop = (id: string, updates: Partial<GradientStop>) => {
    updateGradient({
      stops: localValue.stops.map(stop => 
        stop.id === id ? { ...stop, ...updates } : stop
      )
    });
  };

  const generateCSS = (gradient: GradientValue): string => {
    const stops = gradient.stops
      .sort((a, b) => a.position - b.position)
      .map(stop => `${stop.color} ${stop.position}%`)
      .join(', ');

    if (gradient.type === 'linear') {
      return `linear-gradient(${gradient.direction || 'to right'}, ${stops})`;
    } else {
      return `radial-gradient(circle at ${gradient.center || 'center'}, ${stops})`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Gradient Type */}
      <div className="flex gap-2">
        <Button
          variant={localValue.type === 'linear' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateGradient({ type: 'linear' })}
        >
          Linear
        </Button>
        <Button
          variant={localValue.type === 'radial' ? 'default' : 'outline'}
          size="sm"
          onClick={() => updateGradient({ type: 'radial' })}
        >
          Radial
        </Button>
      </div>

      {/* Direction/Center */}
      <div>
        <Label className="text-xs">
          {localValue.type === 'linear' ? 'Direction' : 'Center'}
        </Label>
        <Select
          value={localValue.type === 'linear' ? localValue.direction : localValue.center}
          onValueChange={(val) => updateGradient(
            localValue.type === 'linear' ? { direction: val } : { center: val }
          )}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={`Select ${localValue.type === 'linear' ? 'direction' : 'center'}`} />
          </SelectTrigger>
          <SelectContent>
            {(localValue.type === 'linear' ? LINEAR_DIRECTIONS : RADIAL_CENTERS).map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gradient Preview */}
      <div className="space-y-2">
        <Label className="text-xs">Preview</Label>
        <div
          className="w-full h-16 rounded-md border"
          style={{ background: generateCSS(localValue) }}
        />
      </div>

      {/* Gradient Stops */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Color Stops</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={addStop}
            className="h-6 px-2"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="space-y-2">
          {localValue.stops.map((stop) => (
            <div key={stop.id} className="flex items-center gap-2">
              <ColorPicker
                value={stop.color}
                onChange={(color) => updateStop(stop.id, { color })}
                type="advanced"
                themeColors={themeColors}
                className="w-20"
              />
              <Input
                type="number"
                min="0"
                max="100"
                value={stop.position}
                onChange={(e) => updateStop(stop.id, { position: parseInt(e.target.value) || 0 })}
                className="w-16 text-xs"
              />
              <span className="text-xs text-gray-500">%</span>
              {localValue.stops.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStop(stop.id)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CSS Output */}
      <div className="space-y-2">
        <Label className="text-xs">CSS</Label>
        <div className="p-2 bg-gray-100 rounded text-xs font-mono">
          {generateCSS(localValue)}
        </div>
      </div>
    </div>
  );
}; 