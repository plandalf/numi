# Template Resolution System

The automation platform includes a comprehensive template resolution system that supports Zapier-style template variables, allowing you to reference data from triggers and previous actions in your workflow configurations.

## Overview

Template variables are enclosed in double curly braces `{{variable}}` and can reference:
- **Trigger data**: `{{trigger__key}}`
- **Previous action outputs**: `{{action__id_key}}`
- **Step outputs**: `{{step__id_key}}`
- **Nested properties**: `{{action__1_response.success}}`

## Template Variable Syntax

### Trigger Data
Reference data from the trigger event:
```
{{trigger__first_name}}
{{trigger__order_id}}
{{trigger__email}}
```

### Action Outputs
Reference data from previous actions in the workflow:
```
{{action__1_member_id}}      // From action with node_id = 1
{{action__2_email_sent}}     // From action with node_id = 2
{{action__123_status}}       // From action with step_id = 123
```

### Step Outputs (Alternative)
Alternative syntax for referencing step outputs:
```
{{step__1_member_id}}        // From step with node_id = 1
{{step__123_status}}         // From step with step_id = 123
```

### Nested Properties
Access nested properties using dot notation:
```
{{action__1_response.success}}
{{action__2_data.items.0.name}}
{{trigger__customer.address.city}}
```

### Underscore Support
The system supports both underscore and dot notation:
```
{{trigger__first_name}}      // Works with underscore
{{trigger__first.name}}      // Works with dot notation
```

## How It Works

### 1. Workflow Execution Context
When a workflow executes, the system builds a comprehensive context that includes:
- Trigger event data
- All completed workflow steps
- Additional context data

### 2. Optimized Lookups
The system uses caching to optimize lookups:
- Context is cached for 5 minutes per execution
- Database queries are minimized
- Step data is indexed by both node_id and step_id

### 3. Template Resolution Process
1. Extract all template variables from configuration
2. Build execution context with trigger and step data
3. Resolve each variable using the appropriate lookup strategy
4. Replace variables with resolved values

## Usage Examples

### Email Action Configuration
```json
{
  "to": "{{trigger__email}}",
  "subject": "Order Confirmation for {{trigger__order_id}}",
  "body": "Hello {{trigger__first_name}}, your order has been confirmed!"
}
```

### Webhook Action Configuration
```json
{
  "url": "https://api.example.com/webhook",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "order_id": "{{trigger__order_id}}",
    "member_id": "{{action__1_member_id}}",
    "email_sent": "{{action__2_email_sent}}"
  }
}
```

### Conditional Logic
```json
{
  "condition": "{{action__1_status}} == 'created'",
  "message": "Member {{action__1_member_id}} was created successfully"
}
```

## Advanced Features

### Array Access
Access array elements using bracket notation:
```
{{action__1_items.0.name}}
{{trigger__line_items.2.quantity}}
```

### Fallback Values
The system gracefully handles missing values:
- Returns empty string for unresolved variables
- Continues execution even if some variables are missing
- Logs warnings for debugging

### Validation
You can validate template variables before execution:
```php
$variables = TemplateResolver::extractTemplateVariables($configuration);
$validation = TemplateResolver::validateTemplateVariables($variables, $context);
```

## Performance Considerations

### Caching Strategy
- Workflow context is cached for 5 minutes
- Cache is cleared after each step execution
- Database queries are optimized with proper indexing

### Memory Usage
- Context data is kept minimal
- Large objects are not stored in cache
- Garbage collection is handled automatically

### Database Optimization
- Workflow steps are queried efficiently
- Only completed steps are included in context
- Proper indexing on execution_id and status

## Error Handling

### Missing Variables
- Unresolved variables return empty strings
- Execution continues with available data
- Warnings are logged for debugging

### Invalid Syntax
- Malformed template variables are ignored
- System continues with valid variables
- Error messages are logged

### Database Errors
- Graceful fallback if step data is unavailable
- Retry logic for transient failures
- Comprehensive error logging

## Testing

### Template Testing Route
Visit `/test-templates` to see template resolution in action:
```json
{
  "context": {
    "trigger": {
      "order_id": 123,
      "first_name": "John",
      "last_name": "Doe"
    },
    "action__1": {
      "member_id": "mem_456",
      "status": "created"
    }
  },
  "results": [
    {
      "template": "Hello {{trigger__first_name}} {{trigger__last_name}}",
      "resolved": "Hello John Doe"
    }
  ]
}
```

### Unit Testing
```php
$template = "Hello {{trigger__first_name}}";
$context = ['trigger' => ['first_name' => 'John']];
$result = TemplateResolver::resolve($template, $context);
// Result: "Hello John"
```

## Best Practices

### Variable Naming
- Use descriptive variable names
- Follow consistent naming conventions
- Document variable sources

### Performance
- Minimize template variable usage in loops
- Use caching effectively
- Monitor template resolution performance

### Error Handling
- Always provide fallback values
- Test templates with various data scenarios
- Monitor logs for resolution errors

### Security
- Validate template inputs
- Sanitize resolved values
- Use proper escaping for HTML/JSON output

## Integration with Workflow Builder

The template resolution system integrates seamlessly with the visual workflow builder:

1. **Variable Suggestions**: The UI suggests available variables
2. **Real-time Validation**: Templates are validated as you type
3. **Preview Mode**: See resolved values before execution
4. **Error Highlighting**: Invalid variables are highlighted

## Future Enhancements

- **Custom Functions**: Support for custom template functions
- **Conditional Logic**: Advanced conditional template resolution
- **Data Transformation**: Built-in data transformation functions
- **External Data**: Support for external data sources
- **Template Libraries**: Reusable template components 