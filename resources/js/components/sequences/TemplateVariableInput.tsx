import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ChevronDown, Variable } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TemplateVariable {
  key: string;
  label: string;
  description?: string;
  example?: string;
  category: 'trigger' | 'action';
  actionId?: number;
}

interface TemplateVariableInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  variables: TemplateVariable[];
  disabled?: boolean;
}

export function TemplateVariableInput({
  value,
  onChange,
  placeholder,
  className,
  variables,
  disabled = false
}: TemplateVariableInputProps) {
  const [showVariables, setShowVariables] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter variables based on search term
  const filteredVariables = variables.filter(variable =>
    variable.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variable.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variable.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group variables by category
  const triggerVariables = filteredVariables.filter(v => v.category === 'trigger');
  const actionVariables = filteredVariables.filter(v => v.category === 'action');

  // Handle variable insertion
  const insertVariable = (variable: TemplateVariable) => {
    const input = inputRef.current;
    if (!input) return;

    const beforeCursor = value.slice(0, cursorPosition);
    const afterCursor = value.slice(cursorPosition);
    const variableText = `{{${variable.key}}}`;
    
    const newValue = beforeCursor + variableText + afterCursor;
    const newPosition = cursorPosition + variableText.length;
    
    onChange(newValue);
    
    // Set cursor position after insertion
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newPosition, newPosition);
      setCursorPosition(newPosition);
    }, 0);
    
    setShowVariables(false);
  };

  // Update cursor position when input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  // Track cursor position
  const handleSelectionChange = () => {
    if (inputRef.current) {
      setCursorPosition(inputRef.current.selectionStart || 0);
    }
  };

  // Check if value contains template variables for styling hints
  const hasTemplateVariables = value && /{{[^}]*}}/.test(value);
  const templateVariableCount = value ? (value.match(/{{[^}]*}}/g) || []).length : 0;

  return (
    <div className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onSelect={handleSelectionChange}
          onKeyUp={handleSelectionChange}
          onClick={handleSelectionChange}
          placeholder={placeholder}
          className={`pr-10 ${hasTemplateVariables ? 'border-blue-200 bg-blue-50/30' : ''} ${className}`}
          disabled={disabled}
        />
        
        {/* Variables button */}
        <Popover open={showVariables} onOpenChange={setShowVariables}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={`absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 ${hasTemplateVariables ? 'text-blue-600' : ''}`}
              disabled={disabled}
            >
              <Variable className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <Command>
              <CommandInput
                placeholder="Search variables..."
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList>
                <CommandEmpty>No template variables found.</CommandEmpty>
                
                {triggerVariables.length > 0 && (
                  <CommandGroup heading="Trigger Data">
                    {triggerVariables.map((variable) => (
                      <CommandItem
                        key={variable.key}
                        onSelect={() => insertVariable(variable)}
                        className="flex flex-col items-start p-3 cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              trigger
                            </Badge>
                            <span className="font-medium">{variable.label}</span>
                          </div>
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {`{{${variable.key}}}`}
                          </code>
                        </div>
                        {variable.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {variable.description}
                          </p>
                        )}
                        {variable.example && (
                          <p className="text-xs text-gray-400 mt-1">
                            Example: {variable.example}
                          </p>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {actionVariables.length > 0 && (
                  <CommandGroup heading="Previous Actions">
                    {actionVariables.map((variable) => (
                      <CommandItem
                        key={variable.key}
                        onSelect={() => insertVariable(variable)}
                        className="flex flex-col items-start p-3 cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              action {variable.actionId}
                            </Badge>
                            <span className="font-medium">{variable.label}</span>
                          </div>
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {`{{${variable.key}}}`}
                          </code>
                        </div>
                        {variable.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {variable.description}
                          </p>
                        )}
                        {variable.example && (
                          <p className="text-xs text-gray-400 mt-1">
                            Example: {variable.example}
                          </p>
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      
      {/* Help text */}
      {hasTemplateVariables ? (
        <p className="text-xs text-blue-600 mt-1">
          ✓ Contains {templateVariableCount} template variable{templateVariableCount !== 1 ? 's' : ''}
        </p>
      ) : (
        <p className="text-xs text-gray-500 mt-1">
          Use template variables like <code className="bg-gray-100 px-1 rounded">{'{{trigger__email}}'}</code> or{' '}
          <code className="bg-gray-100 px-1 rounded">{'{{action_1__id}}'}</code> for dynamic values.
        </p>
      )}
    </div>
  );
}