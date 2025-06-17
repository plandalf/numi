import { AccordionSection } from "../ui/accordion-section";
import type { JsonSchema, JsonSchemaProperty, JsonSchemaType } from "@/types/blocks";
import { FileEditor } from "./file-editor";
import { StringEditor } from "./string-editor";
import { BooleanEditor } from "./boolean-editor";
import { ColorPickerEditor } from "./color-picker-editor";
import { IconPickerEditor } from "./icon-picker-editor";
import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

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
  value: unknown;
  onChange: (newValue: unknown) => void;
  rootSchema?: JsonSchema;
  isRootArray?: boolean;
  themeColors?: Record<string, string>;
}) {

  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [overId, setOverId] = useState<string | number | null>(null);

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
      let newItem: unknown;
      if (schema.items && 'type' in schema.items) {
        if (schema.items.type === 'object' && schema.items.properties) {
          newItem = {};
          if (schema.items.required) {
            schema.items.required.forEach((propName: string) => {
              if (schema.items && 'properties' in schema.items && schema.items.properties) {
                const propSchema = schema.items.properties[propName];
                (newItem as Record<string, unknown>)[propName] = getDefaultForAttribute(propName, items.length) ?? getDefaultForType(propSchema.type as JsonSchemaType);
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
    
    const handleItemChange = (index: number, newItemValue: unknown) => {
      const newItems = [...items];
      newItems[index] = newItemValue;
      onChange(newItems);
    };
    
    const handleDeleteItem = (index: number) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      onChange(newItems);
    };

    const handleDragStart = (event: DragStartEvent) => {
      setActiveId(event.active.id);
    };

    const handleDragOver = (event: DragOverEvent) => {
      setOverId(event.over?.id || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = parseInt(active.id.toString());
        const newIndex = parseInt(over.id.toString());

        const newItems = arrayMove(items, oldIndex, newIndex);
        onChange(newItems);
      }

      // Reset drag state
      setActiveId(null);
      setOverId(null);
    };

    // Ensure items have unique identifiers for drag and drop
    const itemsWithIds = items.map((item, index) => ({
      id: index.toString(),
      data: item,
      index
    }));

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={itemsWithIds.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
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
            getSectionTitle={(item, i) => (item as { label?: string })?.label ?? `Section ${i + 1}`}
            addLabel={isRootArray ? "Add another section" : undefined}
            enableDragAndDrop={isRootArray}
            activeId={activeId}
            overId={overId}
          />
        </SortableContext>
      </DndContext>
    );
  }

  // Handle objects
  if (schema.type === 'object' && schema.properties) {
    const obj = typeof value === 'object' && value !== null ? value : {};
    const handlePropertyChange = (propName: string, propValue: unknown) => {
      onChange({
        ...(obj as Record<string, unknown>),
        [propName]: propValue
      });
    };
    return (
      <div className="space-y-4">
        {Object.entries(schema.properties).map(([propName, propSchema]) => {
          if (propSchema.meta?.editor === 'hidden') return null;
          return (
            <JSONSchemaEditor
              key={propName}
              schema={propSchema}
              path={path ? `${path}.${propName}` : propName}
              value={(obj as Record<string, unknown>)[propName]}
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
        value={value as string}
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
        value={(value as { icon?: string; emoji?: string; url?: string }) || { icon: null, emoji: null, url: null }}
        onChange={onChange}
      />
    );
  }

  // colorSelector
  if ('meta' in schema && schema.meta?.editor === 'colorSelector') {
    return (
      <ColorPickerEditor
        label={schema.title || path.split('.').pop() || 'Color'}
        value={(value as string) || '#FFFFFF'}
        onChange={onChange}
        type='advanced'
      />
    );
  }

  // String input
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  if (type === 'string') {
    return (
      <StringEditor
        label={schema.title || path.split('.').pop() || 'Text'}
        value={(value as string) || ''}
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
        value={!!(value as boolean)}
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

function getDefaultForAttribute(attribute: string, itemCount: number): unknown {
  switch (attribute) {
    case 'label': return `Section ${itemCount + 1}`;
    case 'key': return `section-${itemCount + 1}`;
    default: return null;
  }
}

function getDefaultForType(type: JsonSchemaType): unknown {
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