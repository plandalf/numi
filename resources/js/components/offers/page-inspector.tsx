import { useEffect, useContext } from 'react';
import { GlobalStateContext } from '@/pages/checkout-main';
import { JSONSchemaEditor } from '@/components/editor/json-schema-editor';
import { Block } from '@/types/offer';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';;
import type { HookUsage } from '@/types/blocks';
import { StringEditor } from '@/components/editor/string-editor';
import { BooleanEditor } from '@/components/editor/boolean-editor';
import { EnumerationEditor } from '@/components/editor/enumeration-editor';
import { FileEditor } from '@/components/editor/file-editor';
import { ColorPickerEditor } from '@/components/editor/color-picker-editor';
import { ShadowPickerEditor } from '@/components/editor/shadow-picker-editor';
import { AlignmentPickerEditor } from '@/components/editor/alignment-picker-editor';
import { Theme } from '@/types/theme';
import { useEditor } from '@/contexts/offer/editor-context';
import { getThemeColors } from './page-theme';

export const Inspector = ({
    block,
    onClose,
    onUpdate,
    onSave
}: {
    block: Block;
    onClose: () => void;
    onUpdate: (block: Block) => void;
    onSave: () => void;
}) => {
  const globalState = useContext(GlobalStateContext);
  const { data } = useEditor();

    // Update local state when incoming block changes
    // useEffect(() => {
    //   if (!block) return;
    //   console.log('Inspector received block:', block.id, block.type);
    //   // setSelectedBlock(block);
    // }, [block]);

  const handleContentChange = (fieldName: string, value: any) => {
    if (!block) return;
    // console.log('handleContentChange', fieldName, value, block);
    onUpdate({
      ...block,
      content: {
        ...block.content,
        [fieldName]: value
      }
    });
  };

  const handleValidationChange = (fieldName: string, value: boolean) => {
    if (!block) return;

    onUpdate({
      ...block,
      validation: {
        ...block.validation,
        [fieldName]: value
      }
    });
  };

  const themeColors = getThemeColors(data.theme);

  if (!block) {
    return <div>
      could not find block
    </div>;
  }

  return (
    <div className="p-4">
      {block && globalState?.hookUsage?.[block.id] && (
        <div>
          <div className="space-y-4">
            {globalState.hookUsage[block.id]
              .filter((hook: HookUsage) => hook.inspector !== 'hidden')
              .map((hook: HookUsage) => (
                <div key={hook.name} className="mb-4">
                  {hook.type === 'string' && hook.inspector === 'file' ? (
                    <FileEditor
                      label={hook.label || hook.name}
                      value={block.content?.[hook.name]}
                      onChange={value => handleContentChange(hook.name, value)}
                      preview={block.content?.[hook.name]?.url}
                    />
                  ) : hook.type === 'string' && hook.inspector === 'colorPicker' ? (
                    <ColorPickerEditor
                      label={hook.label || hook.name}
                      value={block.content?.[hook.name] ?? hook.defaultValue}
                      onChange={value => handleContentChange(hook.name, value)}
                      type='advanced'
                      themeColors={themeColors}
                    />
                  ) : hook.type === 'string' ? (
                    <StringEditor
                      label={hook.label || hook.name}
                      value={block.content?.[hook.name] ?? hook.defaultValue}
                      onChange={value => handleContentChange(hook.name, value)}
                      multiline={hook.inspector === 'multiline'}
                    />
                  ) : hook.type === 'boolean' ? (
                    <BooleanEditor
                      label={hook.label || hook.name}
                      value={block.content?.[hook.name] ?? hook.defaultValue}
                      onChange={value => handleContentChange(hook.name, value)}
                    />
                  ) : hook.type === 'enumeration' ? (
                    <EnumerationEditor
                      label={hook.label || hook.name}
                      value={block.content?.[hook.name] ?? hook.defaultValue}
                      onChange={value => handleContentChange(hook.name, value)}
                      options={hook.options || []}
                      icons={hook.icons}
                      inspector={hook.inspector}
                      labels={hook.labels}
                    />
                  ) : hook.type === 'jsonSchema' && hook.schema ? (
                    <JSONSchemaEditor
                      schema={hook.schema}
                      value={block.content?.[hook.name] || []}
                      onChange={newValue => handleContentChange(hook.name, newValue)}
                      themeColors={themeColors}
                    />
                  ) : null}
                </div>
              ))}
          </div>

          {/* Appearance Section */}
          {globalState.hookUsage[block.id]?.some((hook) => hook.type === 'appearance') && (
            <div className="space-y-4">
              <h3 className="mb-2 font-semibold">Appearance</h3>
              {globalState.hookUsage[block.id]
                .filter((hook) => hook.type === 'appearance')
                .map((hook) => {
                  switch (hook.name) {
                    case 'alignment':
                      return (
                        <AlignmentPickerEditor
                          key={hook.name}
                          label="Alignment"
                          value={typeof block.appearance?.alignment === 'string' ? block.appearance.alignment : 'left'}
                          onChange={align => onUpdate({ ...block, appearance: { ...block.appearance, alignment: align } })}
                        />
                      );
                    case 'backgroundColor':
                    case 'textColor':
                      const colorValue = block.appearance?.[hook.name];
                      return (
                        <ColorPickerEditor
                          key={hook.name}
                          label={hook.name === 'backgroundColor' ? 'Background' : 'Text'}
                          value={typeof colorValue === 'string' ? colorValue : '#6800FF'}
                          onChange={color => onUpdate({
                            ...block,
                            appearance: {
                              ...block.appearance,
                              [hook.name]: color,
                            },
                          })}
                          type='advanced'
                          themeColors={themeColors}
                        />
                      );
                    case 'fontWeight':
                      return (
                        <EnumerationEditor
                          key={hook.name}
                          label="Font Weight"
                          value={typeof block.appearance?.fontWeight === 'string' ? block.appearance.fontWeight : 'normal'}
                          onChange={value => onUpdate({ ...block, appearance: { ...block.appearance, fontWeight: value } })}
                          options={['normal', 'semibold', 'bold']}
                          labels={{ normal: 'Normal', semibold: 'Semibold', bold: 'Bold' }}
                        />
                      );
                    case 'border':
                      return (
                        <EnumerationEditor
                          key={hook.name}
                          label='Border'
                          value={block.appearance?.border || 'none'}
                          onChange={value => onUpdate({ ...block, appearance: { ...block.appearance, border: value } })}
                          options={['none', 'xs', 'sm', 'md', 'lg', 'xl']}
                          labels={{ none: 'None', xs: 'Extra Small', sm: 'Small', md: 'Medium', lg: 'Large', xl: 'Extra Large' }}
                        />
                      );
                    case 'borderColor':
                      return (
                        <ColorPickerEditor
                          key={hook.name}
                          label='Border Color'
                          value={block.appearance?.borderColor || '#000'}
                          onChange={value => onUpdate({ ...block, appearance: { ...block.appearance, borderColor: value } })}
                          type='advanced'
                          themeColors={themeColors}
                        />
                      );
                    case 'hidden':
                      return (
                        <BooleanEditor
                          key={hook.name}
                          label='Hidden'
                          value={block.appearance?.hidden || hook.defaultValue}
                          onChange={value => onUpdate({ ...block, appearance: { ...block.appearance, hidden: value } })}
                        />
                      );
                    default:
                      return null;
                  }
                })}
            </div>
          )}

          {/* Validation Section - Only show if block implements useValidation */}
          {globalState.hookUsage[block.id]?.some((hook) => hook.type === 'validation') && (
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                checked={block.validation?.isRequired ?? false}
                onCheckedChange={(checked) => handleValidationChange('isRequired', !!checked)}
              />
              <Label className="mb-0">Required</Label>
            </div>
          )}

          {/* Interaction Section - Only show if block implements useInteraction */}
          {globalState.hookUsage[block.id]?.some((hook) => hook.type === 'interaction') && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={block.interaction?.isDisabled ?? false}
                onCheckedChange={(checked) => {
                  onUpdate({
                    ...block,
                    interaction: {
                      ...block.interaction,
                      isDisabled: !!checked,
                    },
                  });
                }}
              />
              <Label className="mb-0">Disabled?</Label>
            </div>
          )}
        </div>
      )}
    </div>
  )
};
