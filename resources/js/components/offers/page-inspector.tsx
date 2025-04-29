import { useEffect, useContext } from 'react';
import { GlobalStateContext } from '@/pages/Checkout';
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

    // Update local state when incoming block changes
    useEffect(() => {
      if (!block) return;
      console.log('Inspector received block:', block.id, block.type);
      // setSelectedBlock(block);
    }, [block]);

  const handleContentChange = (fieldName: string, value: any) => {
    if (!block) return;

    console.log('handleContentChange', fieldName, value, block);

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


  if (!block) {
    return <div>
      could not find block
    </div>;
  }

    return (
      <div className="p-4">
        <div className="mb-4">
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
                      ) : hook.type === 'string' ? (
                        <StringEditor
                          label={hook.label || hook.name}
                          value={block.content?.[hook.name] ?? hook.defaultValue}
                          onChange={value => handleContentChange(hook.name, value)}
                          multiline={hook.inspector === 'text'}
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
                          labels={hook.labels}
                        />
                      ) : hook.type === 'jsonSchema' && hook.schema ? (
                        <JSONSchemaEditor
                          schema={hook.schema}
                          value={block.content?.[hook.name] || []}
                          onChange={newValue => handleContentChange(hook.name, newValue)}
                        />
                      ) : null}
                    </div>
                  ))}
              </div>

              {/* Appearance Section */}
              {globalState.hookUsage[block.id]?.some((hook) => hook.type === 'appearance') && (
                <div className="mb-6">
                  <h3 className="mb-2 font-semibold">Appearance</h3>
                  {/* Alignment Selector */}
                  {globalState.hookUsage[block.id].some(h => h.name === 'alignment') && (
                    <AlignmentPickerEditor 
                      label="Alignment"
                      value={block.appearance?.alignment || 'left'}
                      onChange={align => onUpdate({ ...block, appearance: { ...block.appearance, alignment: align } })}
                    />
                  )}
                  {/* Color Picker (backgroundColor, textColor) */}
                  {['backgroundColor', 'textColor'].map((colorType) => globalState.hookUsage[block.id].some(h => h.name === colorType) && (
                    <ColorPickerEditor
                      key={colorType}
                      label={colorType === 'backgroundColor' ? 'Background' : 'Text'}
                      value={block.appearance?.[colorType] || '#6800FF'}
                      onChange={color => onUpdate({
                        ...block,
                        appearance: {
                          ...block.appearance,
                          [colorType]: color,
                        },
                      })}
                    />
                  ))}
                  {/* Font Weight Selector */}
                  {globalState.hookUsage[block.id].some(h => h.name === 'fontWeight') && (
                    <EnumerationEditor
                      label="Font Weight"
                      value={block.appearance?.fontWeight || 'normal'}
                      onChange={value => onUpdate({ ...block, appearance: { ...block.appearance, fontWeight: value } })}
                      options={['normal', 'semibold', 'bold']}
                      labels={{ normal: 'Normal', semibold: 'Semibold', bold: 'Bold' }}
                    />
                  )}
                  {/* Shadow Picker */}
                  {globalState.hookUsage[block.id].some(h => h.name === 'border') && (
                    <ShadowPickerEditor
                      label="Border shadow"
                      value={{
                        borderX: block.appearance?.borderX,
                        borderY: block.appearance?.borderY,
                        borderBlur: block.appearance?.borderBlur,
                        borderSpread: block.appearance?.borderSpread,
                      }}
                      onChange={val => onUpdate({
                        ...block,
                        appearance: {
                          ...block.appearance,
                          ...val,
                        },
                      })}
                    />
                  )}
                </div>
              )}

              <h3 className="mt-6 mb-2 font-semibold">Validation</h3>
              <div className="flex items-center gap-2 mb-4">
                <Checkbox
                  checked={block.validation?.isRequired ?? false}
                  onCheckedChange={(checked) => handleValidationChange('isRequired', !!checked)}
                />
                <Label className="mb-0">Is required?</Label>
              </div>

              <h3 className="mb-2 font-semibold">Interaction</h3>
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
                <Label className="mb-0">Is disabled?</Label>
              </div>
            </div>
          )}
        </div>
    </div>
    )
};