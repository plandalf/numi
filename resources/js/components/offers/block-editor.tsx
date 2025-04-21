import React, { useCallback, useState, useEffect } from 'react';
import { Block } from '@/types/offer';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Extended Block interface to allow for dynamic properties
interface ExtendedBlock extends Block {
  [key: string]: any; // Allow for dynamic properties
  appearance?: Record<string, any>;
  content?: { value?: string; [key: string]: any };
  style?: Record<string, any>;
}

// Types for form controls
interface FormControlProps {
  label: string;
  name: string;
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  section?: 'content' | 'appearance' | 'interaction' | 'validation';
}

// Text input control
const TextControl: React.FC<FormControlProps & { rows?: number }> = ({
  label, name, value, onChange, placeholder, rows, section = 'content'
}) => {
  if (rows && rows > 1) {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <Textarea
          id={name}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || ''}
          rows={rows}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input
        id={name}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || ''}
      />
    </div>
  );
};

// Checkbox control
const CheckboxControl: React.FC<FormControlProps> = ({
  label, name, value, onChange, section = 'content'
}) => {
  return (
    <div className="flex items-center space-x-2 mb-2">
      <Checkbox
        id={name}
        checked={Boolean(value)}
        onCheckedChange={(checked) => onChange(checked === true)}
      />
      <Label htmlFor={name}>{label}</Label>
    </div>
  );
};

// Interface for hook configuration
interface HookConfig {
  name: string;
  label: string;
  type: string;
  section?: 'content' | 'appearance' | 'interaction' | 'validation';
  defaultValue?: any;
  inspector?: string;
  [key: string]: any;
}

interface BlockEditorProps {
  block: Block;
  onUpdate: (block: Block) => void;
  formValues?: Record<string, any>;
  formErrors?: Record<string, string[]>;
  setFormValue?: (name: string, value: any) => void;
}


function getBlockComponent() {
  return <div>'getBlockComponent'</div>
}

// Hook Inspector component to analyze block component and extract hooks
const HookInspector: React.FC<{
  block: Block;
  onHooksDetected: (hooks: HookConfig[]) => void;
}> = ({ block, onHooksDetected }) => {
  const BlockComponent = getBlockComponent(block.type);

  // Component to render a block and collect its hooks
  const HookCollector = () => {
    const { getRegisteredHooks } = useNumi();

    // When hooks are registered, pass them to the parent
    useEffect(() => {
      const hooks = getRegisteredHooks();
      if (hooks.length > 0) {
        console.log(`Block Editor: Found ${hooks.length} hooks in ${block.type}:`, hooks);
        onHooksDetected(hooks);
      }
    }, [getRegisteredHooks]);

    // We need to actually render the component to trigger its hooks
    return BlockComponent ? <BlockComponent block={block} isEditing={false} /> : null;
  };

  return 'hook inspector'

  // Render the component in a hidden container
  return (
    <div style={{ display: 'none' }}>
        <HookCollector />

    </div>
  );
};

export default function BlockEditor({
  block,
  onUpdate,
  formValues = {},
  formErrors = {},
  setFormValue
}: BlockEditorProps) {
  const [hooks, setHooks] = useState<HookConfig[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['content']);

  const BlockComponent = getBlockComponent(block.type);

  if (!BlockComponent) {
    return (
      <div className="p-4 text-red-500">
        Unknown block type: {block.type}
      </div>
    );
  }

  // Update a block property based on section
  const updateProperty = useCallback((name: string, value: any, section: string = 'content') => {
    // Cast to extended block type to allow for dynamic properties
    const newBlock = { ...block } as ExtendedBlock;

    // Update the property in the appropriate section
    if (section === 'appearance') {
      // All appearance properties should go in the style object
      newBlock.style = {
        ...(newBlock.style || {}),
        [name]: value
      };
    } else if (section === 'content') {
      // Special case for text content fields - store in content.value
      if (name === 'text' || name === 'value') {
        newBlock.content = {
          ...(newBlock.content || {}),
          value: value
        };
      } else {
        // Check if this is another content property that should go in content
        const content = newBlock.content || {};
        // Fields named for direct content storage
        const contentFields = ['title', 'subtitle', 'description', 'html'];

        if (contentFields.includes(name)) {
          // Store directly in content object
          newBlock.content = {
            ...content,
            [name]: value
          };
        } else {
          // Store other content props in props for backward compatibility
          newBlock.props = {
            ...(newBlock.props || {}),
            [name]: value
          };
        }
      }
    } else if (section === 'interaction') {
      // Store interaction properties in props
      const validInteractionProps = ['disabled', 'readOnly', 'isLoading'];
      if (validInteractionProps.includes(name)) {
        newBlock.props = {
          ...(newBlock.props || {}),
          [name]: value
        };
      }
    } else if (section === 'validation') {
      // Store validation properties in props
      const validValidationProps = ['required', 'validationRules', 'validationMessage', 'pattern'];
      if (validValidationProps.includes(name)) {
        newBlock.props = {
          ...(newBlock.props || {}),
          [name]: value
        };
      }
    }

    onUpdate(newBlock as Block);
  }, [block, onUpdate]);

  // Handle when hooks are detected
  const handleHooksDetected = (detectedHooks: HookConfig[]) => {
    console.group('Block Editor: Hook Detection');
    console.log('Block Type:', block.type);

    // Create a working copy of hooks
    const hooks = [...detectedHooks];

    // For field blocks, add fieldId if not present
    if (block.object === 'field' && !hooks.some(h => h.name === 'fieldId')) {
      const generateFieldId = () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        return `${block.type}_${timestamp}${random}`;
      };

      hooks.push({
        name: 'fieldId',
        label: 'Field ID',
        type: 'text',
        section: 'content',
        defaultValue: (block.props as Record<string, any>)?.fieldId || generateFieldId(),
      });
    }

    // Add fallbacks for text-block if no hooks detected
    if (hooks.length === 0 && block.type === 'text-block') {
      // These are fallbacks in case the component doesn't register hooks
      hooks.push({
        name: 'value',
        label: 'Text',
        type: 'textarea',
        section: 'content',
        defaultValue: block.content?.value || 'Hello World',
        inspector: 'text',
        rows: 5,
        placeholder: 'Enter text here',
        formats: ['markdown', 'plain']
      });

      hooks.push({
        name: 'fontSize',
        label: 'Font Size',
        type: 'text',
        section: 'appearance',
        defaultValue: block.style?.fontSize || '16px',
      });

      hooks.push({
        name: 'color',
        label: 'Text Color',
        type: 'color',
        section: 'appearance',
        defaultValue: block.style?.color || 'inherit',
      });

      hooks.push({
        name: 'backgroundColor',
        label: 'Background Color',
        type: 'color',
        section: 'appearance',
        defaultValue: block.style?.backgroundColor || 'transparent',
      });
    }

    console.log('Processed Hooks:', hooks);

    // Log hooks by section
    const hooksBySection = hooks.reduce((acc, hook) => {
      const section = hook.section || 'content';
      if (!acc[section]) acc[section] = [];
      acc[section].push(hook);
      return acc;
    }, {} as Record<string, HookConfig[]>);

    console.log('Hooks by Section:', hooksBySection);
    console.groupEnd();

    setHooks(hooks);

    // Set which accordion sections should be expanded based on detected hooks
    const sections = new Set<string>();
    sections.add('content'); // Always show content section

    hooks.forEach(hook => {
      if (hook.section) {
        sections.add(hook.section);
      }
    });

    setExpandedSections(Array.from(sections));
  };

  // Render a form control based on hook configuration
  const renderControl = (hook: HookConfig) => {
    const { name, label, type, section = 'content', ...rest } = hook;

    // Get the current value based on the section and name
    let value;
    const typedBlock = block as ExtendedBlock;

    if (section === 'appearance') {
      // All appearance values come from style object
      const style = typedBlock.style || {};
      value = style[name];
    } else if (section === 'content') {
      // Check if this is a special text field that uses content.value
      if (name === 'text' || name === 'value') {
        // Special case for text - get from content.value
        const content = typedBlock.content || {};
        value = content.value;
      } else {
        // Check if this is a content field that should be directly in content
        const content = typedBlock.content || {};
        // Fields that might be stored directly in content
        const contentFields = ['title', 'subtitle', 'description', 'html'];

        if (contentFields.includes(name) && name in content) {
          // Get directly from content object
          value = content[name];
        } else {
          // Other content fields are in props
          const props = typedBlock.props as Record<string, any> || {};
          value = props[name];
        }
      }
    } else if (section === 'interaction') {
      // Get interaction properties from props
      const props = typedBlock.props as Record<string, any> || {};
      value = props[name];
    } else if (section === 'validation') {
      // Get validation properties from props
      const props = typedBlock.props as Record<string, any> || {};
      value = props[name];
    }

    // Apply default value if none is set
    if (value === undefined && hook.defaultValue !== undefined) {
      value = hook.defaultValue;
    }

    switch (type) {
      case 'text':
        return (
          <TextControl
            key={name}
            label={label}
            name={name}
            value={value}
            onChange={(newValue) => updateProperty(name, newValue, section)}
            placeholder={`Enter ${label.toLowerCase()}`}
            section={section as any}
          />
        );

      case 'textarea':
        return (
          <TextControl
            key={name}
            label={label}
            name={name}
            value={value}
            onChange={(newValue) => updateProperty(name, newValue, section)}
            placeholder={`Enter ${label.toLowerCase()}`}
            rows={rest.rows || 3}
            section={section as any}
          />
        );

      case 'checkbox':
        return (
          <CheckboxControl
            key={name}
            label={label}
            name={name}
            value={value}
            onChange={(newValue) => updateProperty(name, newValue, section)}
            section={section as any}
          />
        );

      case 'color':
        return (
          <div key={name} className="space-y-2">
            <Label>{label}</Label>
            <Input
              type="color"
              value={value || '#ffffff'}
              onChange={e => updateProperty(name, e.target.value, section)}
            />
          </div>
        );

      default:
        return (
          <div key={name}>
            <Label>{label}</Label>
            <div className="text-sm text-gray-500">Unsupported control type: {type}</div>
          </div>
        );
    }
  };

  // Group hooks by section
  const hooksBySection = hooks.reduce((acc, hook) => {
    const section = hook.section || 'content';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(hook);
    return acc;
  }, {} as Record<string, HookConfig[]>);

  return (
  
      <div className="space-y-4">
        {/* Invisible component to analyze hooks */}
        <HookInspector block={block} onHooksDetected={handleHooksDetected} />

        <Accordion
          type="multiple"
          defaultValue={expandedSections}
          className="w-full"
        >

        {['content', 'appearance', 'interaction', 'validation']
            .filter(section => hooksBySection[section as keyof typeof hooksBySection]?.length > 0)
            .map(section => (
            <AccordionItem value={section}>
                <AccordionTrigger>{section}</AccordionTrigger>
                <AccordionContent className="space-y-4">
                {hooksBySection[section as keyof typeof hooksBySection]?.map(renderControl)}
                </AccordionContent>
            </AccordionItem>
            ))}
        </Accordion>

        <pre className='bg-gray-50 text-xs p-2 overflow-auto'>{JSON.stringify(block, null, 2)}</pre>
      </div>
  );
}
