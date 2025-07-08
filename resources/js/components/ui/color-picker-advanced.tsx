import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ColorPicker as SimpleColorPicker, ColorPickerProps, parseHexAlpha } from './color-picker';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { HexAlphaColorPicker } from 'react-colorful';
import { Separator } from './separator';
import SearchBar from '../offers/search-bar';
import { Theme } from '@/types/theme';
import { getMatchedThemeValue } from '@/lib/theme';
import { useDebounce } from '@/hooks/use-debounce';
import { GradientPicker, GradientValue } from './gradient-picker';

// Function to parse gradient CSS string into GradientValue object
const parseGradientCSS = (css: string): GradientValue | null => {
  if (!css.includes('gradient')) return null;
  
  try {
    if (css.includes('linear-gradient')) {
      const match = css.match(/linear-gradient\(([^)]+)\)/);
      if (match) {
        const parts = match[1].split(',');
        const direction = parts[0].trim();
        const stops = parts.slice(1).map((stop, index) => {
          const stopMatch = stop.trim().match(/(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8})\s*(\d+)%/);
          if (stopMatch) {
            return {
              id: `stop-${index}`,
              color: stopMatch[1],
              position: parseInt(stopMatch[2])
            };
          }
          return {
            id: `stop-${index}`,
            color: '#000000',
            position: index * 50
          };
        });
        
        return {
          type: 'linear',
          direction,
          stops
        };
      }
    } else if (css.includes('radial-gradient')) {
      const match = css.match(/radial-gradient\([^,]+,\s*([^)]+)\)/);
      if (match) {
        const parts = match[1].split(',');
        const stops = parts.map((stop, index) => {
          const stopMatch = stop.trim().match(/(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{8})\s*(\d+)%/);
          if (stopMatch) {
            return {
              id: `stop-${index}`,
              color: stopMatch[1],
              position: parseInt(stopMatch[2])
            };
          }
          return {
            id: `stop-${index}`,
            color: '#000000',
            position: index * 50
          };
        });
        
        return {
          type: 'radial',
          center: 'center',
          stops
        };
      }
    }
  } catch (error) {
    console.error('Error parsing gradient CSS:', error);
  }
  
  return null;
};

interface AdvancedColorPickerProps extends Omit<ColorPickerProps, 'type'> {
  trigger?: React.ReactNode;
  themeColors?: Record<string, { value: string, label: string }>;
  asChild?: boolean;
  supportsGradients?: boolean; // New prop to enable gradient support
}

export const AdvancedColorPicker: React.FC<AdvancedColorPickerProps> = ({
  trigger,
  value: initialValue,
  onChange,
  themeColors = [],
  className,
  asChild,
  supportsGradients = false
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [hexInput, setHexInput] = useState('');
  const [opacityInput, setOpacityInput] = useState('');
  const [localColor, setLocalColor] = useState(typeof initialValue === 'string' ? initialValue : '#000000');

  // Check if the value is a gradient
  const isGradient = typeof initialValue === 'string' && 
    (initialValue.includes('linear-gradient') || initialValue.includes('radial-gradient'));
  
  const matchedThemeValue = getMatchedThemeValue(initialValue);
  const value = useMemo(() => {
    if (matchedThemeValue && !isGradient) {
      return themeColors?.[matchedThemeValue]?.value ?? initialValue;
    }
    return initialValue;
  }, [initialValue, matchedThemeValue, themeColors, isGradient]);

  // Only parse hex alpha for solid colors, not gradients
  const { rgb, alpha } = isGradient ? { rgb: '#000000', alpha: 255 } : parseHexAlpha(value);
  const percent = Math.round((alpha / 255) * 100);

  useEffect(() => {
    setHexInput(rgb.toUpperCase());
    setOpacityInput(percent.toString());
  }, [value]);

  const handleHexChange = (newHex: string) => {
    const filteredHex = newHex.replace('#', '').replace(/[^0-9A-Fa-f]/g, '').slice(0, 6);
    setHexInput(filteredHex);
    
    if (filteredHex.length === 6) {
      const currentOpacity = parseInt(opacityInput) || 0;
      const newAlpha = Math.round((currentOpacity / 100) * 255);
      onChange(`#${filteredHex}${newAlpha.toString(16).padStart(2, '0')}`);
    }
  };

  const handleOpacityChange = (newOpacity: string) => {
    const filteredOpacity = newOpacity.replace(/[^0-9]/g, '');
    setOpacityInput(filteredOpacity);
    
    const numOpacity = parseInt(filteredOpacity);
    if (!isNaN(numOpacity) && numOpacity >= 0 && numOpacity <= 100) {
      const newAlpha = Math.round((numOpacity / 100) * 255);
      onChange(`${rgb}${newAlpha.toString(16).padStart(2, '0')}`);
    }
  };

  const filteredThemeColors = Object.entries(themeColors).filter(
    ([key, color]) =>
      key.toLowerCase().includes(search.toLowerCase()) ||
      color.label.toLowerCase().includes(search.toLowerCase()) ||
      color.value.toLowerCase().includes(search.toLowerCase())
  );

  const hasThemeColors = Object.keys(themeColors).length > 0;
  const defaultTabValue = matchedThemeValue ? 'theme' : 'custom';
  const debouncedColor = useDebounce(localColor, 100);

  // Effect for debounced size updates
  useEffect(() => {
    if (debouncedColor && debouncedColor !== value) {
      onChange(debouncedColor);
    }
  }, [debouncedColor]);


  // const debouncedOnChange = useCallback(useDebounce((value: string) => onChange(value), 1000), [onChange]);

  const tabComponent = (
    <Tabs defaultValue={defaultTabValue} className="w-full">
      <TabsList className="flex w-full border-b">
        <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>
        {hasThemeColors && <TabsTrigger value="theme" className="flex-1">Theme</TabsTrigger>}
        {supportsGradients && <TabsTrigger value="gradient" className="flex-1">Gradient</TabsTrigger>}
      </TabsList>
      <TabsContent value="custom" className="numi-color-picker space-y-2">
        {hasThemeColors && <Separator className="my-4" />}
        <HexAlphaColorPicker
          color={localColor}
          onChange={(color) => setLocalColor(color)}
        />
        <div className="flex items-center gap-2 border border-gray-300/50 rounded-md px-2 py-1 h-8">
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexChange(e.target.value)}
            className="flex-1 text-xs text-left bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            placeholder="#000000"
          />
          <Separator orientation="vertical" className="bg-gray-300/50 !h-8" />
          <input
            type="text"
            value={opacityInput}
            onChange={(e) => handleOpacityChange(e.target.value)}
            className="w-12 text-xs text-left bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            placeholder="100"
          />
          <span className="text-xs text-gray-500">%</span>
        </div>
      </TabsContent>
      {hasThemeColors && (
        <TabsContent value="theme">
          <Separator className="mt-4"/>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search"
            className="mb-0"
            inputClassName="w-full border-none !ring-0 focus:!ring-0 shadow-none"
          />
          <Separator className="mb-3"/>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {filteredThemeColors.map(([key, color]) => (
              <button
                key={key}
                className={cn(
                  'flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-100 cursor-pointer',
                  matchedThemeValue && matchedThemeValue.toLowerCase() === key.toLowerCase() && 'bg-gray-300/50'
                )}
                onClick={() => {
                  onChange(`{{theme.${key}}}`);
                  setOpen(false);
                }}
              >
                <span
                  className="w-5 h-5 rounded-sm border"
                  style={{ background: color?.value }}
                />
                <span className="text-xs flex-1 text-left">{color?.label}</span>
                <span className="text-xs text-gray-500">{color?.value.toUpperCase()}</span>
              </button>
            ))}
            {filteredThemeColors.length === 0 && (
              <span className="text-xs text-gray-400 px-2 py-4">No colors found.</span>
            )}
          </div>
        </TabsContent>
      )}
      {supportsGradients && (
        <TabsContent value="gradient" className="space-y-4">
          <GradientPicker
            value={parseGradientCSS(initialValue) || {
              type: 'linear',
              direction: 'to right',
              stops: [
                { id: '1', color: '#FF6B6B', position: 0 },
                { id: '2', color: '#4ECDC4', position: 100 }
              ]
            }}
            onChange={(gradient) => {
              // Convert gradient to CSS string
              const stops = gradient.stops
                .sort((a, b) => a.position - b.position)
                .map(stop => `${stop.color} ${stop.position}%`)
                .join(', ');
              
              const css = gradient.type === 'linear' 
                ? `linear-gradient(${gradient.direction || 'to right'}, ${stops})`
                : `radial-gradient(circle at ${gradient.center || 'center'}, ${stops})`;
              
              onChange(css);
            }}
            themeColors={themeColors}
          />
        </TabsContent>
      )}
    </Tabs>
  );

  if(asChild) {
    return tabComponent;
  }
  
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {trigger ? trigger : (
          <button
            className={cn(
              'flex items-center gap-4 border border-gray-300/50 rounded-lg px-2 py-1.5 w-full cursor-pointer',
              className
            )}
          >
            <div className='flex items-center gap-2'>
              <span
                className="w-5.5 h-5.5 rounded-sm border"
                style={{ background: value }}
              />
              <span className="text-xs">
                {isGradient ? 'Gradient' : matchedThemeValue ? themeColors?.[matchedThemeValue]?.label : rgb.toUpperCase()}
              </span>
            </div>
            {!isGradient && (
              <div className='flex items-center gap-2'>
                <Separator orientation="vertical" className="bg-gray-300/50 !h-4" />
                <span className="text-xs text-end">{opacityInput} %</span>
              </div>
            )}
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" className={cn(
        'p-4 w-[320px] h-[450px] bg-white rounded-lg shadow-lg z-50',
        !hasThemeColors && 'h-[380px]'
      )}>
        {tabComponent}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 