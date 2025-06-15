import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Code2, AlertTriangle, Check } from 'lucide-react';

interface TemplateVariable {
  id: string;
  name: string;
  type: string;
  description?: string;
  sampleData?: Record<string, unknown>;
}

interface TemplateContext {
  [actionId: string]: TemplateVariable;
}

interface TemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  context: TemplateContext;
  multiline?: boolean;
  className?: string;
  disabled?: boolean;
}

// Parse template variables from text like {{action_1.data.name}}
function parseTemplateVariables(text: string): { variable: string; start: number; end: number }[] {
  const variables: { variable: string; start: number; end: number }[] = [];
  const regex = /\{\{([^}]+)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    variables.push({
      variable: match[1].trim(),
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return variables;
}

// Validate a template variable against the context
function validateVariable(variable: string, context: TemplateContext): string | null {
  const parts = variable.split('.');
  if (parts.length < 2) {
    return 'Template variables must reference an action (e.g., {{action_1.data}})';
  }

  const actionId = parts[0];
  
  // Check if action exists
  if (!context[actionId]) {
    return `Action "${actionId}" not found. Available actions: ${Object.keys(context).join(', ')}`;
  }

  return null;
}

export function TemplateEditor({
  value,
  onChange,
  placeholder,
  context,
  multiline = false,
  className = '',
  disabled = false,
}: TemplateEditorProps) {
  // Validation status
  const variables = useMemo(() => parseTemplateVariables(value), [value]);
  const errors = useMemo(() => {
    return variables.map(({ variable }) => ({
      variable,
      error: validateVariable(variable, context),
    })).filter(({ error }) => error !== null);
  }, [variables, context]);

  const hasErrors = errors.length > 0;
  const hasVariables = variables.length > 0;

  // Insert template variable helper
  const insertTemplate = () => {
    const template = '{{}}';
    const newValue = `${value}${template}`;
    onChange(newValue);
  };

  // Get available actions for suggestions
  const availableActions = Object.keys(context);

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Template Helper */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={insertTemplate}
          className="text-xs"
          disabled={disabled}
        >
          <Code2 className="w-3 h-3 mr-1" />
          Insert Variable
        </Button>
        
        {/* Available Actions */}
        {availableActions.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Available:</span>
            <div className="flex gap-1">
              {availableActions.slice(0, 3).map((actionId) => (
                <Button
                  key={actionId}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs h-6 px-2"
                  onClick={() => {
                    const newValue = `${value}{{${actionId}.data}}`;
                    onChange(newValue);
                  }}
                  disabled={disabled}
                >
                  {actionId}
                </Button>
              ))}
              {availableActions.length > 3 && (
                <span className="text-xs text-gray-500">+{availableActions.length - 3} more</span>
              )}
            </div>
          </div>
        )}
        
        {/* Status Indicator */}
        {hasVariables && (
          <div className="flex items-center gap-1 ml-auto">
            {hasErrors ? (
              <>
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-red-600">Template errors</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600">Valid</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="relative">
        <InputComponent
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={`font-mono text-sm ${hasErrors ? 'border-red-500' : ''}`}
          rows={multiline ? 4 : undefined}
        />
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map(({ variable, error }, index) => (
            <div
              key={index}
              className="text-xs flex items-start gap-2 text-red-600"
            >
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-mono">{`{{${variable}}}`}</span>: {error}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Help */}
      {value.includes('{{') && !hasErrors && (
        <div className="text-xs text-gray-500 flex items-start gap-1">
          <span>💡</span>
          <span>
            Use <code className="bg-gray-100 px-1 rounded">{'{{action_id.property}}'}</code> to reference data from previous steps.
          </span>
        </div>
      )}
      
      {/* No previous actions message */}
      {availableActions.length === 0 && (
        <div className="text-xs text-gray-500">
          No previous actions available for templating. Add actions above this step to reference their outputs.
        </div>
      )}
    </div>
  );
}

export default TemplateEditor; 