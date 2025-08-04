import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronDown, Plus, X, Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { MapField } from './MapField';
import { TemplateVariableInput } from './TemplateVariableInput';
import { useTemplateVariables } from '@/hooks/useTemplateVariables';
import axios from 'axios';

interface FieldSchema {
  key: string;
  label: string;
  type: string;
  required: boolean;
  description?: string;
  help?: string;
  placeholder?: string;
  dynamic?: boolean;
  dynamicSource?: string;
  default?: unknown;
  options?: Record<string, string> | Array<{ value: string; label: string; }>;
  resource?: string;
  multiple?: boolean;
}

interface SequenceData {
  triggers?: Array<{
    id: number;
    name?: string;
    trigger_key?: string;
    test_result?: Record<string, unknown>;
    app?: {
      name: string;
    };
  }>;
  actions?: Array<{
    id: number;
    name?: string;
    action_key?: string;
    test_result?: Record<string, unknown>;
    app?: {
      name: string;
    };
  }>;
}

interface TriggerConfigFieldProps {
  field: FieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  appKey: string;
  integrationId?: number;
  error?: string;
  requiresAuth?: boolean;
  sequenceData?: SequenceData;
  currentActionId?: number;
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
  error,
  requiresAuth = false,
  sequenceData,
  currentActionId
}: TriggerConfigFieldProps) {
  const [loading, setLoading] = useState(false);
  const [resourceOptions, setResourceOptions] = useState<ResourceOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCombobox, setShowCombobox] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);

  // Generate template variables from sequence data
  const templateVariables = useTemplateVariables({
    triggers: sequenceData?.triggers || [],
    actions: sequenceData?.actions || [],
    currentActionId
  });

  const loadResourceData = useCallback(async (search?: string) => {
    if (!field.dynamicSource || (requiresAuth && !integrationId)) return;

    try {
      setLoading(true);
      setResourceError(null);

      // Parse the dynamic source (e.g., "offer.id,name")
      const [resourceKey] = field.dynamicSource.split('.');

      //apps/{app}/resources/{resource}
      // const response = await axios.get('/automation/resources/search', {
      const response = await axios.get(`/automation/apps/${appKey}/resources/${resourceKey}`, {
        params: {
          ...(requiresAuth && integrationId && { integration_id: integrationId }),
          search: search || searchTerm || '',
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
  }, [field.dynamicSource, requiresAuth, integrationId, appKey, searchTerm]);

  // Load dynamic resource data
  useEffect(() => {
    const shouldLoad = field.dynamic && field.dynamicSource && (!requiresAuth || integrationId);
    if (shouldLoad) {
      loadResourceData();
    }
  }, [field.dynamic, field.dynamicSource, integrationId, requiresAuth, loadResourceData, value]);

  const handleSearch = (search: string) => {
    setSearchTerm(search);
    if (field.dynamic && field.dynamicSource && (!requiresAuth || integrationId)) {
      // Debounce the search
      const timeoutId = setTimeout(() => {
        loadResourceData(search);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  };

  // Helper function to render multi-select for dynamic fields
  const renderMultiSelect = () => {
    const values = Array.isArray(value) ? value : [];
    const selectedOptions = resourceOptions.filter(opt => values.includes(opt.value));

    return (
      <Popover open={showCombobox} onOpenChange={setShowCombobox}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={showCombobox}
            className={`w-full justify-between min-h-[2.5rem] h-auto ${error ? 'border-red-300' : ''}`}
            disabled={requiresAuth && !integrationId}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {selectedOptions.length > 0 ? (
                selectedOptions.map((option) => (
                  <Badge key={option.value} variant="secondary" className="text-xs">
                    {option.label}
                    <button
                      type="button"
                      className="ml-1 hover:bg-gray-200 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        const newValues = values.filter(v => v !== option.value);
                        onChange(newValues);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <span className="text-gray-500">Select {field.label.toLowerCase()}...</span>
              )}
            </div>
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
            <CommandList>
              <CommandGroup>
                {resourceOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={`${option.value}-${option.label}`}
                    onSelect={() => {
                      const newValues = values.includes(option.value)
                        ? values.filter(v => v !== option.value)
                        : [...values, option.value];
                      onChange(newValues);
                    }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${values.includes(option.value) ? 'opacity-100' : 'opacity-0'}`} />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  };

  // Helper function to render multi-value inputs (for non-dynamic fields)
  const renderMultipleInputs = (inputRenderer: (val: string, index: number) => React.ReactNode) => {
    const values = Array.isArray(value) ? value : value ? [value] : [''];
    
    return (
      <div className="space-y-2">
        {values.map((val, index) => (
          <div key={index} className="flex gap-2 items-start">
            <div className="flex-1">
              {inputRenderer(String(val), index)}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-0 h-10 w-10 p-0"
              onClick={() => {
                const newValues = values.filter((_, i) => i !== index);
                onChange(newValues.length === 0 ? [''] : newValues);
              }}
              disabled={values.length === 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => {
            const newValues = [...values, ''];
            onChange(newValues);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add {field.label}
        </Button>
      </div>
    );
  };

  const renderField = () => {
    console.log('TriggerConfigField@renderField', field, 'value:', value);

    // Handle multiple values for select fields with static options
    if (field.multiple && field.type === 'select') {
      const values = Array.isArray(value) ? value : [];
      const normalizedOptions = field.options ?
        Array.isArray(field.options)
          ? field.options
          : Object.entries(field.options).map(([key, value]) => ({ value: key, label: value }))
        : [];

      return (
        <Popover open={showCombobox} onOpenChange={setShowCombobox}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={showCombobox}
              className={`w-full justify-between min-h-[2.5rem] h-auto ${error ? 'border-red-300' : ''}`}
            >
              <div className="flex flex-wrap gap-1 flex-1">
                {values.length > 0 ? (
                  values.map((val) => {
                    const option = normalizedOptions.find(opt => opt.value === val);
                    return option ? (
                      <Badge key={val} variant="secondary" className="text-xs">
                        {option.label}
                        <button
                          type="button"
                          className="ml-1 hover:bg-gray-200 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            const newValues = values.filter(v => v !== val);
                            onChange(newValues);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })
                ) : (
                  <span className="text-gray-500">Select {field.label.toLowerCase()}...</span>
                )}
              </div>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />
              <CommandEmpty>No options found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {normalizedOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={`${option.value}-${option.label}`}
                      onSelect={() => {
                        const newValues = values.includes(option.value)
                          ? values.filter(v => v !== option.value)
                          : [...values, option.value];
                        onChange(newValues);
                      }}
                    >
                      <Check className={`mr-2 h-4 w-4 ${values.includes(option.value) ? 'opacity-100' : 'opacity-0'}`} />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      );
    }

    switch (field.type) {
      case 'string':
        if (field.dynamic && field.dynamicSource) {
          // Dynamic select/combobox
          if (field.multiple) {
            return renderMultiSelect();
          }

          const selectedOption = resourceOptions.find(opt => opt.value === value);

          return (
            <Popover open={showCombobox} onOpenChange={setShowCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={showCombobox}
                  className={`w-full justify-between ${error ? 'border-red-300' : ''}`}
                  disabled={requiresAuth && !integrationId}
                >
                  {selectedOption ? selectedOption.label : value ? String(value) : `Select ${field.label.toLowerCase()}...`}
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
                        value={`${option.value}-${option.label}`}
                        onSelect={() => {
                          onChange(option.value === value ? "" : option.value);
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
          if (field.multiple) {
            return renderMultipleInputs((val, index) => {
              const values = Array.isArray(value) ? value : value ? [value] : [''];
              
              if (sequenceData && templateVariables.length > 0) {
                return (
                  <TemplateVariableInput
                    value={val}
                    onChange={(newVal) => {
                      const newValues = [...values];
                      newValues[index] = newVal;
                      onChange(newValues);
                    }}
                    placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
                    className={error ? 'border-red-300' : ''}
                    variables={templateVariables}
                  />
                );
              }

              return (
                <Input
                  value={val}
                  onChange={(e) => {
                    const newValues = [...values];
                    newValues[index] = e.target.value;
                    onChange(newValues);
                  }}
                  placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
                  className={error ? 'border-red-300' : ''}
                />
              );
            });
          }

          // Use TemplateVariableInput if we have sequence data and template variables
          if (sequenceData && templateVariables.length > 0) {
            return (
              <TemplateVariableInput
                value={String(value || '')}
                onChange={onChange}
                placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
                className={error ? 'border-red-300' : ''}
                variables={templateVariables}
              />
            );
          }

          // Regular text input
          return (
            <Input
              value={String(value || '')}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
              className={error ? 'border-red-300' : ''}
            />
          );
        }

      case 'text':
        if (field.multiple) {
          return renderMultipleInputs((val, index) => {
            const values = Array.isArray(value) ? value : value ? [value] : [''];
            
            return (
              <Textarea
                value={val}
                onChange={(e) => {
                  const newValues = [...values];
                  newValues[index] = e.target.value;
                  onChange(newValues);
                }}
                placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
                className={error ? 'border-red-300' : ''}
                rows={3}
              />
            );
          });
        }

        return (
          <Textarea
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
            className={error ? 'border-red-300' : ''}
            rows={3}
          />
        );

      case 'email':
        if (field.multiple) {
          return renderMultipleInputs((val, index) => {
            const values = Array.isArray(value) ? value : value ? [value] : [''];
            
            if (sequenceData && templateVariables.length > 0) {
              return (
                <TemplateVariableInput
                  value={val}
                  onChange={(newVal) => {
                    const newValues = [...values];
                    newValues[index] = newVal;
                    onChange(newValues);
                  }}
                  placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
                  className={error ? 'border-red-300' : ''}
                  variables={templateVariables}
                />
              );
            }

            return (
              <Input
                type="email"
                value={val}
                onChange={(e) => {
                  const newValues = [...values];
                  newValues[index] = e.target.value;
                  onChange(newValues);
                }}
                placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
                className={error ? 'border-red-300' : ''}
              />
            );
          });
        }

        // Use TemplateVariableInput for email fields too since they often use template variables
        if (sequenceData && templateVariables.length > 0) {
          return (
            <TemplateVariableInput
              value={String(value || '')}
              onChange={onChange}
              placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
              className={error ? 'border-red-300' : ''}
              variables={templateVariables}
            />
          );
        }

        return (
          <Input
            type="email"
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
            className={error ? 'border-red-300' : ''}
          />
        );

      case 'number':
        if (field.multiple) {
          return renderMultipleInputs((val, index) => {
            const values = Array.isArray(value) ? value : value ? [value] : [''];
            
            return (
              <Input
                type="number"
                value={val}
                onChange={(e) => {
                  const newValues = [...values];
                  newValues[index] = Number(e.target.value);
                  onChange(newValues);
                }}
                placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
                className={error ? 'border-red-300' : ''}
              />
            );
          });
        }

        return (
          <Input
            type="number"
            value={String(value || '')}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
            className={error ? 'border-red-300' : ''}
          />
        );

      case 'select': {
        // Normalize options to array format
        const normalizedOptions = field.options ?
          Array.isArray(field.options)
            ? field.options
            : Object.entries(field.options).map(([key, value]) => ({ value: key, label: value }))
          : [];

        return (
          <Select value={String(value || '')} onValueChange={onChange}>
            <SelectTrigger className={error ? 'border-red-300' : ''}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {normalizedOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

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

      case 'json': {
        return (
          <div className="space-y-2">
            <Textarea
              value={typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2)}
              onChange={(e) => {
                try {
                  // Try to parse as JSON to validate
                  JSON.parse(e.target.value);
                  onChange(e.target.value);
                } catch {
                  // If invalid JSON, still update the value for user to correct
                  onChange(e.target.value);
                }
              }}
              placeholder={field.placeholder || field.description || 'Enter valid JSON'}
              className={`font-mono text-sm ${error ? 'border-red-300' : ''}`}
              rows={6}
            />
            <p className="text-xs text-gray-500">
              Enter valid JSON. Use template variables like {`{{order.id}}`} for dynamic values.
            </p>
          </div>
        );
      }

      case 'map': {
        const mapValue = (value as Record<string, string>) || {};

        return (
          <div className="space-y-2">
            <MapField
              value={mapValue}
              onChange={onChange}
              emptyText={`No ${field.label.toLowerCase().includes('header') ? 'headers' : 'entries'} yet. Click the button above to add one.`}
              addButtonText={`Add ${field.label.toLowerCase().includes('header') ? 'Header' : 'Entry'}`}
            />
            {field.help && (
              <p className="text-xs text-gray-500">{field.help}</p>
            )}
          </div>
        );
      }

      case 'resource': {
        if (field.dynamic && field.dynamicSource) {
          // Dynamic resource select/combobox - similar to dynamic string but specifically for resources
          if (field.multiple) {
            return renderMultiSelect();
          }

          const selectedOption = resourceOptions.find(opt => opt.value === value);

          return (
            <Popover open={showCombobox} onOpenChange={setShowCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={showCombobox}
                  className={`w-full justify-between ${error ? 'border-red-300' : ''}`}
                  disabled={requiresAuth && !integrationId}
                >
                  {selectedOption ? selectedOption.label : value ? String(value) : `Select ${field.label.toLowerCase()}...`}
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
                        value={`${option.value}-${option.label}`}
                        onSelect={() => {
                          onChange(option.value === value ? "" : option.value);
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
          if (field.multiple) {
            return renderMultipleInputs((val, index) => {
              const values = Array.isArray(value) ? value : value ? [value] : [''];
              
              return (
                <Input
                  value={val}
                  onChange={(e) => {
                    const newValues = [...values];
                    newValues[index] = e.target.value;
                    onChange(newValues);
                  }}
                  placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
                  className={error ? 'border-red-300' : ''}
                />
              );
            });
          }

          // Static resource input
          return (
            <Input
              value={String(value || '')}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
              className={error ? 'border-red-300' : ''}
            />
          );
        }
      }

      default:
        if (field.multiple) {
          return renderMultipleInputs((val, index) => {
            const values = Array.isArray(value) ? value : value ? [value] : [''];
            
            if (field.type === 'string' && sequenceData && templateVariables.length > 0) {
              return (
                <TemplateVariableInput
                  value={val}
                  onChange={(newVal) => {
                    const newValues = [...values];
                    newValues[index] = newVal;
                    onChange(newValues);
                  }}
                  placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
                  className={error ? 'border-red-300' : ''}
                  variables={templateVariables}
                />
              );
            }

            return (
              <Input
                value={val}
                onChange={(e) => {
                  const newValues = [...values];
                  newValues[index] = e.target.value;
                  onChange(newValues);
                }}
                placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
                className={error ? 'border-red-300' : ''}
              />
            );
          });
        }

        // For string-type fields, use TemplateVariableInput if we have sequence data
        if (field.type === 'string' && sequenceData && templateVariables.length > 0) {
          return (
            <TemplateVariableInput
              value={String(value || '')}
              onChange={onChange}
              placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
              className={error ? 'border-red-300' : ''}
              variables={templateVariables}
            />
          );
        }

        return (
          <Input
            value={String(value || '')}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || field.description || `Enter ${field.label.toLowerCase()}`}
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
        {field.multiple && (
          <Badge variant="secondary" className="text-xs">Multiple</Badge>
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

      {field.dynamic && !integrationId && requiresAuth && (
        <p className="text-xs text-orange-500">
          Integration required to load dynamic options
        </p>
      )}
    </div>
  );
}
