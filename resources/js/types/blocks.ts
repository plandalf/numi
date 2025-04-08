// Types
export interface BlockConfig {
    id: string;
    type: string;
    object: 'block' | 'field';
    content: Record<string, any>;
    interaction?: Record<string, any>;
    appearance?: Record<string, any>;
    validation?: Record<string, any>;
}


export interface FieldState {
    blockId: string;
    fieldName: string;
    value: any;
    type: 'string' | 'boolean' | 'number';
  }
  

export interface HookUsage {
    name: string;
    type: 'boolean' | 'string' | 'validation' | 'interaction' | 'enumeration' | 'jsonSchema' | 'appearance' | 'eventCallback';
    defaultValue: any;
    inspector?: string;
    schema?: any; // For jsonSchema type
    options?: string[]; // For enumeration type
    labels?: Record<string, string>; // For enumeration type labels
    label?: string; // For display label
  }
  

export interface GlobalState {
  fieldStates: Record<string, FieldState>;
  updateFieldState: (blockId: string, fieldName: string, value: any) => void;
  getFieldState: (blockId: string, fieldName: string) => FieldState | undefined;
  registerHook: (hook: HookUsage) => void;
  hookUsage: Record<string, HookUsage>;
}

export interface BlockContextType {
    blockId: string;
    blockConfig: BlockConfig;
    globalState: GlobalState;
    registerField: (fieldName: string, defaultValue: any) => void;
    getFieldValue: (fieldName: string) => any;
    setFieldValue: (fieldName: string, value: any) => void;
    registerHook: (hook: HookUsage) => void;
}




// Add after the Editor component but before the Welcome component 
// JSONSchema Editor Components
type JsonSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null';

interface JsonSchemaProperty {
  type: JsonSchemaType | JsonSchemaType[];
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty | JsonSchemaProperty[];
  format?: string;
  description?: string;
  meta?: {
    editor?: string;
  };
  $ref?: string;
  required?: string[];
}

interface JsonSchema {
  $schema?: string;
  type: JsonSchemaType | JsonSchemaType[];
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
  meta?: {
    editor?: string;
  };
}
