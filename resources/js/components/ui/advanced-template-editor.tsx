import React, { useMemo, useRef, useCallback, useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { EditorView, keymap, Decoration, DecorationSet } from '@codemirror/view';
import { Extension, StateField, StateEffect } from '@codemirror/state';
import { syntaxHighlighting, HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import {
  autocompletion,
  completionKeymap,
  Completion,
  CompletionContext,
  startCompletion,
} from '@codemirror/autocomplete';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code2, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';

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

interface AdvancedTemplateEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  context: TemplateContext;
  multiline?: boolean;
  className?: string;
  disabled?: boolean;
}

interface ValidationError {
  from: number;
  to: number;
  message: string;
  variable: string;
}

// Parse template variables from text
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
  if (parts.length < 1) {
    return 'Invalid template variable format';
  }

  const actionId = parts[0];
  
  // Check if action exists
  if (!context[actionId]) {
    const availableActions = Object.keys(context);
    if (availableActions.length === 0) {
      return 'No previous actions available for templating';
    }
    return `Action "${actionId}" not found. Available: ${availableActions.join(', ')}`;
  }

  // If it's just the action ID, that's valid
  if (parts.length === 1) {
    return null;
  }

  // Check if trying to access nested properties
  if (parts.length > 1) {
    const propertyPath = parts.slice(1).join('.');
    const sampleData = context[actionId].sampleData;
    
    if (!sampleData) {
      return `No sample data available for action "${actionId}"`;
    }

    // Try to navigate the property path
    let current: unknown = sampleData;
    const pathParts = propertyPath.split('.');
    
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        const availablePaths = generatePropertyPaths(sampleData).slice(0, 5);
        return `Property "${propertyPath}" not found in ${actionId}. Available: ${availablePaths.join(', ')}${availablePaths.length >= 5 ? '...' : ''}`;
      }
    }
  }

  return null;
}

// Custom syntax highlighting for template variables
const templateHighlighting = HighlightStyle.define([
  {
    tag: tags.string,
    color: '#22c55e', // Green color for template variables
    fontWeight: 'bold',
  },
  {
    tag: tags.keyword,
    color: '#22c55e', // Green for the variable parts
    fontWeight: 'bold',
  },
]);

// Function to generate nested property paths from sample data
function generatePropertyPaths(obj: unknown, prefix = '', maxDepth = 4): string[] {
  const paths: string[] = [];
  
  if (!obj || typeof obj !== 'object' || maxDepth <= 0) {
    return paths;
  }

  const entries = Object.entries(obj as Record<string, unknown>);
  
  for (const [key, value] of entries) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    paths.push(fullPath);
    
    // Recursively add nested properties
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...generatePropertyPaths(value, fullPath, maxDepth - 1));
    }
  }
  
  return paths;
}

// Function to get the value type and preview
function getValuePreview(obj: unknown, path: string): { type: string; preview: string } {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return { type: 'unknown', preview: 'undefined' };
    }
  }
  
  const type = Array.isArray(current) ? 'array' : typeof current;
  let preview = '';
  
  if (current === null) {
    preview = 'null';
  } else if (current === undefined) {
    preview = 'undefined';
  } else if (typeof current === 'string') {
    preview = `"${current.slice(0, 30)}${current.length > 30 ? '...' : ''}"`;
  } else if (typeof current === 'number' || typeof current === 'boolean') {
    preview = String(current);
  } else if (Array.isArray(current)) {
    preview = `[${current.length} items]`;
  } else if (typeof current === 'object') {
    const keys = Object.keys(current);
    preview = `{${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}}`;
  } else {
    preview = String(current).slice(0, 30);
  }
  
  return { type, preview };
}

// Variable item component for the popover
function VariableItem({ 
  actionId, 
  path, 
  actionData, 
  onSelect, 
  isAction = false 
}: { 
  actionId: string; 
  path?: string; 
  actionData: TemplateVariable; 
  onSelect: (variable: string) => void;
  isAction?: boolean;
}) {
  const fullPath = path ? `${actionId}.${path}` : actionId;
  const { type, preview } = path && actionData.sampleData 
    ? getValuePreview(actionData.sampleData, path)
    : { type: 'action', preview: actionData.description || 'Action output' };

  return (
    <button
      onClick={() => onSelect(`{{${fullPath}}}`)}
      className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 group"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs">
              {isAction ? '⚡' : '📦'}
            </span>
            <code className="text-sm font-mono text-green-600 font-semibold">
              {fullPath}
            </code>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
              {type}
            </span>
          </div>
          <div className="text-xs text-gray-500 truncate">
            {preview}
          </div>
        </div>
        <div className="text-gray-400 group-hover:text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      </div>
    </button>
  );
}

export function AdvancedTemplateEditor({
  value,
  onChange,
  placeholder,
  context,
  multiline = false,
  className = '',
  disabled = false,
}: AdvancedTemplateEditorProps) {
  const editorRef = useRef(null);
  const [showVariablePopover, setShowVariablePopover] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Generate all available variables for the popover
  const allVariables = useMemo(() => {
    const variables: Array<{ actionId: string; path?: string; actionData: TemplateVariable; isAction: boolean }> = [];
    
    Object.entries(context).forEach(([actionId, actionData]) => {
      // Add the main action
      variables.push({ actionId, actionData, isAction: true });
      
      // Add all nested properties
      if (actionData.sampleData) {
        const paths = generatePropertyPaths(actionData.sampleData);
        paths.forEach(path => {
          variables.push({ actionId, path, actionData, isAction: false });
        });
      }
    });
    
    return variables;
  }, [context]);

  // Create autocomplete source
  const autocompleteSource = useCallback((completionContext: CompletionContext) => {
    const { state, pos } = completionContext;
    const line = state.doc.lineAt(pos);
    const lineText = line.text;
    const linePos = pos - line.from;
    
    // Find if we're inside template brackets
    let templateStart = -1;
    let templateEnd = -1;
    
    // Look backwards for opening {{
    for (let i = linePos - 1; i >= 0; i--) {
      if (lineText.slice(i, i + 2) === '{{') {
        templateStart = i;
        break;
      }
      if (lineText[i] === '}') {
        break; // We're not in a template
      }
    }
    
    // Look forwards for closing }}
    if (templateStart !== -1) {
      for (let i = linePos; i < lineText.length - 1; i++) {
        if (lineText.slice(i, i + 2) === '}}') {
          templateEnd = i;
          break;
        }
      }
    }
    
    // If we're not inside template brackets, don't show suggestions
    if (templateStart === -1) {
      return null;
    }
    
    // Get the text inside the template brackets
    const templateContent = templateEnd !== -1 
      ? lineText.slice(templateStart + 2, templateEnd)
      : lineText.slice(templateStart + 2, linePos);
    
    const suggestions: Completion[] = [];
    const searchTerm = templateContent.toLowerCase().trim();
    
    // Generate suggestions based on what's been typed
    if (searchTerm === '' || !searchTerm.includes('.')) {
      // Show action suggestions when no dot or empty
      for (const [actionId, actionData] of Object.entries(context)) {
        if (actionId.toLowerCase().includes(searchTerm)) {
          suggestions.push({
            label: actionId,
            detail: actionData.description || `Output from ${actionData.name}`,
            type: 'variable',
            info: `Reference data from ${actionData.name}`,
                         apply: (view) => {
               // Replace the entire template content with the selected action + .data
               const fullReplacement = `${actionId}.data`;
               const templateFrom = line.from + templateStart + 2;
               const templateTo = templateEnd !== -1 
                 ? line.from + templateEnd 
                 : pos;
               
               view.dispatch({
                 changes: {
                   from: templateFrom,
                   to: templateTo,
                   insert: fullReplacement
                 },
                 selection: { anchor: line.from + templateStart + 2 + fullReplacement.length }
               });
             },
          });
        }
      }
    } else {
      // Show property suggestions when there's a dot
      const parts = searchTerm.split('.');
      const actionId = parts[0];
      const propertyPath = parts.slice(1).join('.');
      
      if (context[actionId]?.sampleData) {
        const allPaths = generatePropertyPaths(context[actionId].sampleData);
        
        for (const path of allPaths) {
          const fullPath = `${actionId}.${path}`;
          if (path.toLowerCase().includes(propertyPath) || propertyPath === '') {
            const { type, preview } = getValuePreview(context[actionId].sampleData, path);
            
            suggestions.push({
              label: fullPath,
              detail: preview,
              type: 'property',
              info: `${type} • ${preview}`,
                             apply: (view) => {
                 // Replace the entire template content with the selected path
                 const templateFrom = line.from + templateStart + 2;
                 const templateTo = templateEnd !== -1 
                   ? line.from + templateEnd 
                   : pos;
                 
                 view.dispatch({
                   changes: {
                     from: templateFrom,
                     to: templateTo,
                     insert: fullPath
                   },
                   selection: { 
                     anchor: templateEnd !== -1 
                       ? line.from + templateEnd + 2  // Move cursor after }}
                       : line.from + templateStart + 2 + fullPath.length
                   }
                 });
               },
            });
          }
        }
      }
    }

    if (suggestions.length === 0) {
      return null;
    }

    return {
      from: pos,
      options: suggestions.slice(0, 10), // Limit suggestions
    };
  }, [context]);

  // Create autocomplete extension with enhanced configuration
  const autocompleteExtension = useMemo(() => {
    return autocompletion({
      override: [autocompleteSource],
      activateOnTyping: true,
      maxRenderedOptions: 10,
      defaultKeymap: true,
      tooltipClass: () => 'cm-tooltip-autocomplete-custom',
      optionClass: (completion) => `cm-completions-option cm-completions-option-${completion.type}`,
      closeOnBlur: true,
      selectOnOpen: true,
      interactionDelay: 75,
    });
  }, [autocompleteSource]);

  // Custom theme with enhanced template variable highlighting
  const customTheme = EditorView.theme({
    '&': {
      fontSize: '14px',
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    },
    '.cm-content': {
      padding: multiline ? '12px' : '8px 12px',
      minHeight: multiline ? '120px' : '40px',
      caretColor: '#3b82f6',
    },
    '.cm-focused': {
      outline: 'none',
    },
    '.cm-editor': {
      borderRadius: '6px',
      border: '1px solid #d1d5db',
    },
    '.cm-editor.cm-focused': {
      border: '1px solid #3b82f6',
      boxShadow: '0 0 0 2px rgb(59 130 246 / 0.2)',
    },
    // Enhanced autocomplete styling
    '.cm-tooltip-autocomplete-custom': {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
      fontSize: '14px',
      maxHeight: '250px',
      overflow: 'auto',
      padding: '4px',
      minWidth: '280px',
    },
    '.cm-completions-option': {
      padding: '10px 12px',
      borderRadius: '6px',
      margin: '1px 0',
      display: 'flex',
      alignItems: 'center',
      cursor: 'pointer',
      justifyContent: 'space-between',
    },
    '.cm-completions-option[aria-selected]': {
      background: '#eff6ff',
      borderLeft: '3px solid #3b82f6',
    },
    '.cm-completions-option-variable': {
      '&::before': {
        content: '"⚡"',
        marginRight: '8px',
        fontSize: '14px',
      },
    },
    '.cm-completions-option-property': {
      '&::before': {
        content: '"📦"',
        marginRight: '8px',
        fontSize: '14px',
      },
    },
  });

  // Custom extension to highlight template variables
  const templateHighlightExtension = EditorView.baseTheme({
    '.cm-template-variable': {
      color: '#22c55e',
      fontWeight: 'bold',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderRadius: '3px',
      padding: '1px 2px',
      border: '1px solid rgba(34, 197, 94, 0.3)',
    },
    '.cm-template-variable-valid': {
      color: '#22c55e',
      fontWeight: 'bold',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderRadius: '3px',
      padding: '1px 2px',
      border: '1px solid rgba(34, 197, 94, 0.3)',
    },
    '.cm-template-variable-error': {
      color: '#ef4444',
      fontWeight: 'bold',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderRadius: '3px',
      padding: '1px 2px',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      textDecoration: 'underline wavy #ef4444',
    },
  });

  // Combine all extensions
  const extensions = useMemo((): Extension[] => {
    return [
      syntaxHighlighting(templateHighlighting),
      autocompleteExtension,
      customTheme,
      templateHighlightExtension,
            keymap.of([
        ...completionKeymap,
        {
          key: 'Ctrl-Space',
          run: startCompletion,
        },
        {
          key: 'Cmd-Space',
          run: startCompletion,
        },

      ]),
        EditorView.lineWrapping,
    ];
  }, [autocompleteExtension, customTheme, templateHighlightExtension]);

  // Validate template variables
  const validateTemplate = useCallback((text: string) => {
    const variables = parseTemplateVariables(text);
    const errors: ValidationError[] = [];

    variables.forEach(({ variable, start, end }) => {
      const error = validateVariable(variable, context);
      if (error) {
        errors.push({
          from: start,
          to: end,
          message: error,
          variable: `{{${variable}}}`,
        });
      }
    });

    setValidationErrors(errors);
  }, [context]);

  // Handle variable selection from popover
  const handleVariableSelect = useCallback((variable: string) => {
    // Insert the variable at the current cursor position
    const newValue = value + variable;
    onChange(newValue);
    setShowVariablePopover(false);
    
    // Focus back to editor
    if (editorRef.current) {
      setTimeout(() => {
        const editor = editorRef.current as unknown as { view?: { focus: () => void } };
        if (editor?.view) {
          editor.view.focus();
        }
      }, 100);
    }
  }, [value, onChange]);

  // Validate when value or context changes
  useEffect(() => {
    validateTemplate(value);
  }, [value, context, validateTemplate]);

  // Close popover when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowVariablePopover(false);
      }
    };

    if (showVariablePopover) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVariablePopover]);

  return (
    <div className={`template-editor relative ${className}`}>
      {/* Insert Variable Button */}
      <div className="mb-2 relative">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowVariablePopover(!showVariablePopover)}
          className="text-xs"
          disabled={disabled || Object.keys(context).length === 0}
        >
          <Code2 className="w-3 h-3 mr-1" />
          Insert Variable
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>

        {/* Variable Popover */}
        {showVariablePopover && (
          <div
            ref={popoverRef}
            className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
          >
            <div className="p-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Available Variables</h3>
              <p className="text-xs text-gray-500 mt-1">
                Click to insert a variable into your template
              </p>
            </div>
            
            <ScrollArea className="max-h-80">
              <div className="divide-y divide-gray-100">
                {allVariables.length > 0 ? (
                  allVariables.map((variable, index) => (
                    <VariableItem
                      key={`${variable.actionId}-${variable.path || 'root'}-${index}`}
                      actionId={variable.actionId}
                      path={variable.path}
                      actionData={variable.actionData}
                      onSelect={handleVariableSelect}
                      isAction={variable.isAction}
                    />
                  ))
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Code2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No variables available</p>
                    <p className="text-xs mt-1">Add actions above this step to see their outputs</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* CodeMirror Editor */}
      <CodeMirror
        ref={editorRef}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        editable={!disabled}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
          searchKeymap: false,
          tabSize: 2,
        }}
        extensions={extensions}
        height={multiline ? '120px' : '40px'}
      />

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="mt-2 space-y-2">
          {validationErrors.map((error, index) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
            >
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-medium text-red-800">
                  Invalid template variable: <code className="bg-red-100 px-1 rounded">{error.variable}</code>
                </div>
                <div className="text-red-600 mt-1">{error.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Success indicator when all variables are valid */}
      {value && parseTemplateVariables(value).length > 0 && validationErrors.length === 0 && (
        <div className="mt-2 flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span>All template variables are valid</span>
        </div>
      )}
    </div>
  );
}

export default AdvancedTemplateEditor; 