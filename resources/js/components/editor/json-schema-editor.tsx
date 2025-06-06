import { AccordionSection } from "../ui/accordion-section";
import type { JsonSchema, JsonSchemaProperty, JsonSchemaType } from "@/types/blocks";
import { FileEditor } from "./file-editor";
import { EnumerationEditor } from "./enumeration-editor";
import { StringEditor } from "./string-editor";
import { BooleanEditor } from "./boolean-editor";
import { ColorPickerEditor } from "./color-picker-editor";
import { useEffect } from "react";
import { IconPickerEditor } from "./icon-picker-editor";

export function JSONSchemaEditor({
  schema,
  path = '',
  value,
  onChange,
  rootSchema,
  isRootArray = true,
  themeColors,
}: {
  schema: JsonSchema | JsonSchemaProperty;
  path?: string;
  value: any;
  onChange: (newValue: any) => void;
  rootSchema?: JsonSchema;
  isRootArray?: boolean;
  themeColors?: Record<string, string>;
}) {
  const schemaToUse = rootSchema || schema;


  // Handle $ref references
  if ('$ref' in schema && schema.$ref) {
    if (schema.$ref === '#' && rootSchema) {
      return (
        <JSONSchemaEditor
          schema={rootSchema}
          path={path}
          value={value}
          onChange={onChange}
          rootSchema={rootSchema}
          isRootArray={isRootArray}
          themeColors={themeColors}
        />
      );
    }
  }

  // Handle arrays
  if (schema.type === 'array' && schema.items) {
    const items = Array.isArray(value) ? value : [];
    const handleAddItem = () => {
      let newItem: any;
      if (schema.items && 'type' in schema.items) {
        if (schema.items.type === 'object' && schema.items.properties) {
          newItem = {};
          if (schema.items.required) {
            schema.items.required.forEach((propName: string) => {
              if (schema.items && 'properties' in schema.items && schema.items.properties) {
                const propSchema = schema.items.properties[propName];
                newItem[propName] = getDefaultForAttribute(propName, items.length) ?? getDefaultForType(propSchema.type as JsonSchemaType);
              }
            });
          }
        } else if (schema.items.type === 'string') {
          newItem = '';
        } else if (schema.items.type === 'number') {
          newItem = 0;
        } else if (schema.items.type === 'boolean') {
          newItem = false;
        } else if (schema.items.type === 'array') {
          newItem = [];
        } else {
          newItem = null;
        }
      } else {
        newItem = {}; // Default to object
      }
      const newItems = [...items, newItem];
      onChange(newItems);
    };
    const handleItemChange = (index: number, newItemValue: any) => {
      const newItems = [...items];
      newItems[index] = newItemValue;
      onChange(newItems);
    };
    const handleDeleteItem = (index: number) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      onChange(newItems);
    };
    return (
      <AccordionSection
        items={items}
        onAdd={isRootArray ? handleAddItem : undefined}
        onDelete={isRootArray ? handleDeleteItem : undefined}
        renderSection={(item, index) => (
          <JSONSchemaEditor
            schema={schema.items as JsonSchemaProperty}
            path={`${path}[${index}]`}
            value={item}
            onChange={(newValue) => handleItemChange(index, newValue)}
            rootSchema={rootSchema}
            isRootArray={false}
            themeColors={themeColors}
          />
        )}
        getSectionTitle={(item, i) => item?.label ?? `Section ${i + 1}`}
        addLabel={isRootArray ? "Add another section" : undefined}
      />
    );
  }

  // Handle objects
  if (schema.type === 'object' && schema.properties) {
    const obj = typeof value === 'object' && value !== null ? value : {};
    const handlePropertyChange = (propName: string, propValue: any) => {
      onChange({
        ...obj,
        [propName]: propValue
      });
    };
    return (
      <div className="space-y-4">
        {Object.entries(schema.properties).map(([propName, propSchema]) => {
          if (propSchema.meta?.editor === 'hidden') return null;
          return (
            <JSONSchemaEditor
              schema={propSchema}
              path={path ? `${path}.${propName}` : propName}
              value={obj[propName]}
              onChange={(newValue) => handlePropertyChange(propName, newValue)}
              rootSchema={rootSchema}
              isRootArray={isRootArray}
              themeColors={themeColors}
            />
          );
        })}
      </div>
    );
  }

  // fileUpload
  if ('meta' in schema && schema.meta?.editor === 'fileUpload') {
    return (
      <FileEditor
        label={schema.title || path.split('.').pop() || 'File'}
        value={value}
        onChange={onChange}
        preview={typeof value === 'string' ? value : undefined}
      />
    );
  }

  // iconSelector
  if ('meta' in schema && schema.meta?.editor === 'iconSelector') {
    return (
      <IconPickerEditor
        label={schema.title || 'Icon'}
        value={value || ''}
        onChange={onChange}
      />
    );
  }

  // colorSelector
  if ('meta' in schema && schema.meta?.editor === 'colorSelector') {
    return (
      <ColorPickerEditor
        label={schema.title || path.split('.').pop() || 'Color'}
        value={value || '#FFFFFF'}
        onChange={onChange}
        type='advanced'
        themeColors={themeColors}
      />
    );
  }

  // String input
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (type === 'string') {
    return (
      <StringEditor
        label={schema.title || path.split('.').pop() || 'Text'}
        value={value || ''}
        onChange={onChange}
        multiline={schema.meta?.editor === 'markdown'}
      />
    );
  }

  // Boolean input
  if (type === 'boolean') {
    return (
      <BooleanEditor
        label={schema.title || path.split('.').pop() || 'Boolean'}
        value={!!value}
        onChange={onChange}
      />
    );
  }

  // Fallback for unsupported types
  return (
    <div className="p-2 text-red-500 text-sm">
      Unsupported schema type: {JSON.stringify(schema.type)}
    </div>
  );
}

function getDefaultForAttribute(attribute: string, itemCount: number): any {
  switch (attribute) {
    case 'label': return `Section ${itemCount + 1}`;
    case 'key': return `section-${itemCount + 1}`;
    default: return null;
  }
}
function getDefaultForType(type: JsonSchemaType): any {
  switch (type) {
    case 'string': return '';
    case 'number': return 0;
    case 'boolean': return false;
    case 'object': return {};
    case 'array': return [];
    case 'null': return null;
    default: return null;
  }
}

function isJsonSchemaProperty(schema: JsonSchema | JsonSchemaProperty): schema is JsonSchemaProperty {
  return (
    typeof schema === 'object' &&
    'type' in schema &&
    (Array.isArray(schema.type) ? schema.type.includes('string') : typeof schema.type === 'string')
  );
}