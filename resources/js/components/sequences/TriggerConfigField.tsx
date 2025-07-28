import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import axios from 'axios';

interface FieldSchema {
  key: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  help?: string;
  dynamic?: boolean;
  dynamicSource?: string;
  default?: unknown;
  options?: Array<{ value: string; label: string; }>;
}

interface TriggerConfigFieldProps {
  field: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  appKey: string;
  integrationId?: number;
  error?: string;
}

interface ResourceOption {
  value: string;
  label: string;
  data?: Record<string, unknown>;
}

export function TriggerConfigField({ 
  field, 
  value, 
  onChange, 
  appKey, 
  integrationId, 
  error 
}: TriggerConfigFieldProps) {
  const [loading, setLoading] = useState(false);
  const [resourceOptions, setResourceOptions] = useState<ResourceOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCombobox, setShowCombobox] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);

  // Load dynamic resource data
  useEffect(() => {
    if (field.dynamic && field.dynamicSource && integrationId) {
      loadResourceData();
    }
  }, [field.dynamic, field.dynamicSource, integrationId]);

  const loadResourceData = async (search?: string) => {
    if (!field.dynamicSource || !integrationId) return;

    try {
      setLoading(true);
      setResourceError(null);
      
      // Parse the dynamic source (e.g., "offer.id,name")
      const [resourceKey] = field.dynamicSource.split('.');
      
      const response = await axios.get('/automation/resources/search', {
        params: {
          app_key: appKey,
          resource_key: resourceKey,
          integration_id: integrationId,
          search: search || searchTerm,
        },
      });

      if (response.data.success) {
        setResourceOptions(response.data.data);
        setResourceError(null);
      } else {
        setResourceError(response.data.error || 'Failed to load options');
        setResourceOptions([]);
      }
    } catch (error) {
      console.error('Failed to load resource data:', error);
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        setResourceError(error.response.data.error);
      } else {
        setResourceError('Failed to load options. Please check your integration.');
      }
      setResourceOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    if (field.dynamic && field.dynamicSource && integrationId) {
      // Debounce the search
      const timeoutId = setTimeout(() => {
        loadResourceData(search);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  };

  const renderField = () => {
    switch (field.type) {
      case 'string':
        if (field.dynamic && field.dynamicSource) {
          // Dynamic select/combobox
          const selectedOption = resourceOptions.find(opt => opt.value === value);
          
          return (
            <Popover open={showCombobox} onOpenChange={setShowCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={showCombobox}
                  className={`w-full justify-between ${error ? 'border-red-300' : ''}`}
                  disabled={!integrationId}
                >
                  {selectedOption ? selectedOption.label : `Select ${field.label.toLowerCase()}...`}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder={`Search ${field.label.toLowerCase()}...`}
                    value={searchTerm}
                    onValueChange={handleSearch}
                  />
                  <CommandEmpty>
                    {loading ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading...
                      </div>
                    ) : (
                      `No ${field.label.toLowerCase()} found.`
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {resourceOptions.map((option) => (
                      <CommandItem
                        key={option.value}
                        value={option.value}
                        onSelect={(currentValue) => {
                          onChange(currentValue === value ? "" : currentValue);
                          setShowCombobox(false);
                        }}
                      >
                        {option.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          );
        } else {
          // Regular text input
          return (
            <Input
              value={String(value || '')}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
              className={error ? 'border-red-300' : ''}
            />
          );
        }

      case 'text':
        return (
          <Textarea
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
            className={error ? 'border-red-300' : ''}
            rows={3}
          />
        );

      case 'email':
        return (
          <Input
            type="email"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
            className={error ? 'border-red-300' : ''}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={String(value || '')}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
            className={error ? 'border-red-300' : ''}
          />
        );

      case 'select':
        return (
          <Select value={String(value || '')} onValueChange={onChange}>
            <SelectTrigger className={error ? 'border-red-300' : ''}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={Boolean(value)}
              onCheckedChange={(checked) => onChange(checked)}
            />
            <Label htmlFor={field.key} className="text-sm">
              {field.description || field.label}
            </Label>
          </div>
        );

      default:
        return (
          <Input
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.description || `Enter ${field.label.toLowerCase()}`}
            className={error ? 'border-red-300' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor={field.key} className="text-sm font-medium">
          {field.label}
        </Label>
        {field.required && (
          <Badge variant="outline" className="text-xs">Required</Badge>
        )}
        {field.dynamic && (
          <Badge variant="secondary" className="text-xs">Dynamic</Badge>
        )}
      </div>
      
      {renderField()}
      
      {field.help && (
        <p className="text-xs text-gray-500">{field.help}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      
      {resourceError && (
        <p className="text-xs text-red-500">
          <span className="font-medium">Resource Error:</span> {resourceError}
        </p>
      )}
      
      {field.dynamic && !integrationId && (
        <p className="text-xs text-orange-500">
          Integration required to load dynamic options
        </p>
      )}
    </div>
  );
} 