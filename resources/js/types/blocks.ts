import { RuleGroup } from "@/components/editor/condition-visibility-editor";
import { Event } from "@/components/editor/interaction-event-editor";
import type { Theme } from "@/types/theme";

// Types
export interface BlockConfig {
    id: string;
    type: string;
    object: 'block' | 'field';
    content: Record<string, any>;
    interaction?: Record<string, any>;
    appearance?: Record<string, any>;
    style?: Record<string, any>;
    conditions?: Record<string, any>;
    validation?: Record<string, any>;
}


export interface FieldState {
    blockId: string;
    fieldName: string;
    value: any;
    type: 'string' | 'boolean' | 'number';
  }

export type HookTypeSection = 'appearance' | 'style' | 'validation' | 'interaction' | 'conditions';
export type HookType = HookTypeSection | 'boolean' | 'string' | 'enumeration' | 'jsonSchema' | 'eventCallback' | 'number' | 'visibility';

export interface HookUsage {
    name: string;
    type: HookType;
    defaultValue: any;
    inspector?: string;
    config?: Record<string, any>; // Configuration settings for the hook if there are any
    schema?: any; // For jsonSchema type
    options?: string[] | Record<'value' | 'label', string>[]; // For enumeration type
    labels?: Record<string, string>; // For enumeration type labels
    label?: string; // For display label
    min?: number; // For number type
    max?: number; // For number type
    items?: any[];
    events?: { label: string; events: Event[], required?: boolean }[];
    group?: string;
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
    theme?: Theme | null;
    hidden?: boolean;
}




// Add after the Editor component but before the Welcome component
// JSONSchema Editor Components
export type JsonSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'null' | 'color' | 'appearance';

export interface JsonSchemaProperty {
  type: JsonSchemaType | JsonSchemaType[];
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty | JsonSchemaProperty[];
  title?: string;
  format?: string;
  description?: string;
  meta?: {
    editor?: string;
  };
  $ref?: string;
  required?: string[];
  visibility?: boolean | RuleGroup;
}

export interface JsonSchema {
  $schema?: string;
  title?: string;
  type: JsonSchemaType | JsonSchemaType[];
  properties?: Record<string, JsonSchemaProperty>;
  items?: JsonSchemaProperty;
  required?: string[];
  meta?: {
    editor?: string;
  };
  visibility?: boolean | RuleGroup;
}
