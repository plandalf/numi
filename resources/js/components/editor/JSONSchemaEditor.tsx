function JSONSchemaEditor({
  schema,
  path = '',
  value,
  onChange,
  rootSchema,
}: {
  schema: JsonSchema | JsonSchemaProperty;
  path?: string;
  value: any;
  onChange: (newValue: any) => void;
  rootSchema?: JsonSchema;
}) {
  const schemaToUse = rootSchema || schema;

  // Handle $ref references
  if ('$ref' in schema && schema.$ref) {
    // For now, we only handle basic references like "#" which refers to the root schema
    if (schema.$ref === '#' && rootSchema) {
      return (
        <JSONSchemaEditor
          schema={rootSchema}
          path={path}
          value={value}
          onChange={onChange}
          rootSchema={rootSchema}
        />
      );
    }
    // More complex ref handling would go here
  }

  // Handle arrays
  if (schema.type === 'array' && schema.items) {
    const items = Array.isArray(value) ? value : [];
    
    const handleAddItem = () => {
      // Create empty item based on schema
      let newItem: any;
      
      if ('type' in schema.items) {
        if (schema.items.type === 'object' && schema.items.properties) {
          newItem = {};
          // Initialize required properties
          if (schema.items.required) {
            schema.items.required.forEach(propName => {
              if (schema.items && 'properties' in schema.items && schema.items.properties) {
                const propSchema = schema.items.properties[propName];
                newItem[propName] = getDefaultForType(propSchema.type as JsonSchemaType);
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
    
    const handleRemoveItem = (index: number) => {
      const newItems = [...items];
      newItems.splice(index, 1);
      onChange(newItems);
    };

    return (
      <div className="border rounded p-2 space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-medium text-sm">{path.split('.').pop() || 'Items'}</label>
          <button
            type="button"
            onClick={handleAddItem}
            className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          >
            Add Item
          </button>
        </div>
        
        {items.length === 0 && (
          <div className="text-gray-500 text-sm">No items. Click 'Add Item' to create one.</div>
        )}
        
        {items.map((item, index) => (
          <div key={index} className="border-t pt-2 pl-2">
            <div className="flex justify-between items-center mb-1">
              <div className="text-xs font-medium">Item {index + 1}</div>
              <button
                type="button"
                onClick={() => handleRemoveItem(index)}
                className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600"
              >
                Remove
              </button>
            </div>
            
            <JSONSchemaEditor
              schema={schema.items as JsonSchemaProperty}
              path={`${path}[${index}]`}
              value={item}
              onChange={(newValue) => handleItemChange(index, newValue)}
              rootSchema={rootSchema}
            />
          </div>
        ))}
      </div>
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
      <div className="space-y-3">
        {path && <div className="font-medium text-sm">{path.split('.').pop()}</div>}
        
        <div className="space-y-2 pl-2">
          {Object.entries(schema.properties).map(([propName, propSchema]) => {
            // Skip rendering if property is meant to be hidden
            if (propSchema.meta?.editor === 'hidden') return null;
            
            return (
              <div key={propName} className="border-t pt-2">
                <JSONSchemaEditor
                  schema={propSchema}
                  path={path ? `${path}.${propName}` : propName}
                  value={obj[propName]}
                  onChange={(newValue) => handlePropertyChange(propName, newValue)}
                  rootSchema={rootSchema}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  // Handle primitives based on special formats and editors
  if ('meta' in schema && schema.meta?.editor === 'fileUpload') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {path.split('.').pop() || 'File'} {schema.description && <span className="text-xs text-gray-500">({schema.description})</span>}
        </label>
        <div className="flex items-center space-x-2">
          {value && (
            <img src={value} alt="Preview" className="h-10 w-10 object-cover" />
          )}
          <input
            type="file"
            className="border border-gray-300 rounded-md p-1 text-sm"
            onChange={(e) => {
              // In a real implementation, you would upload the file and get a URL
              // For demo purposes, we'll just use a placeholder URL
              onChange('https://placehold.co/100x100.png');
            }}
          />
        </div>
      </div>
    );
  }
  
  if ('meta' in schema && schema.meta?.editor === 'iconSelector') {
    // Simple icon selector with a few options
    const icons = ['star', 'heart', 'circle', 'square', 'triangle'];
    
    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {path.split('.').pop() || 'Icon'} {schema.description && <span className="text-xs text-gray-500">({schema.description})</span>}
        </label>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="border border-gray-300 rounded-md p-1 w-full"
        >
          <option value="">Select an icon</option>
          {icons.map(icon => (
            <option key={icon} value={icon}>{icon}</option>
          ))}
        </select>
      </div>
    );
  }
  
  // Basic type handling
  const type = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  
  // String input
  if (type === 'string') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {path.split('.').pop() || 'Text'} {schema.description && <span className="text-xs text-gray-500">({schema.description})</span>}
        </label>
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="border border-gray-300 rounded-md p-1 w-full"
        />
      </div>
    );
  }
  
  // Number input
  if (type === 'number' || type === 'integer') {
    return (
      <div>
        <label className="block text-sm font-medium mb-1">
          {path.split('.').pop() || 'Number'} {schema.description && <span className="text-xs text-gray-500">({schema.description})</span>}
        </label>
        <input
          type="number"
          value={value || 0}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="border border-gray-300 rounded-md p-1 w-full"
        />
      </div>
    );
  }
  
  // Boolean input
  if (type === 'boolean') {
    return (
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span className="text-sm font-medium">
            {path.split('.').pop() || 'Boolean'} {schema.description && <span className="text-xs text-gray-500">({schema.description})</span>}
          </span>
        </label>
      </div>
    );
  }
  
  // Fallback for unsupported types
  return (
    <div className="p-2 text-red-500 text-sm">
      Unsupported schema type: {JSON.stringify(schema.type)}
    </div>
  );
}

// Helper function to create default values for types
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