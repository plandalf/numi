import { useEffect, useContext } from 'react';
import { GlobalState, GlobalStateContext } from '@/pages/checkout-main';
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
import { AlignmentPickerEditor } from '@/components/editor/alignment-picker-editor';
import { NumberEditor } from '../editor/number-editor';
import { ConditionOnClickEditor } from '../editor/condition-onclick-editor';
import { ConditionVisibilityEditor } from '../editor/condition-visibility-editor';

export const AppearanceEditor = ({ globalState, block, onUpdate }: { globalState: GlobalState | null, block: Block, onUpdate: (block: Block) => void }) => {
  if (!globalState) return null;
  return (
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
            case 'activeBackgroundColor':
            case 'inactiveBackgroundColor':
            case 'textColor':
              const colorValue = block.appearance?.[hook.name];
              return (
                <ColorPickerEditor
                  key={hook.name}
                  label={hook.label || 'Text'}
                  value={typeof colorValue === 'string' ? colorValue : '#6800FF'}
                  onChange={color => onUpdate({
                    ...block,
                    appearance: {
                      ...block.appearance,
                      [hook.name]: color,
                    },
                  })}
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
            case 'visibility':
              return (
                <ConditionVisibilityEditor
                  value={block.appearance?.visibility?.conditional || []}
                  onChange={value => onUpdate({ ...block, appearance: { ...block.appearance, visibility: { conditional: value } } })}
                />
              );
            default:
              return null;
          }
        })}
    </div>
  );
}

export const ConditionsSection = ({ globalState, block, onUpdate }: { globalState: GlobalState | null, block: Block, onUpdate: (block: Block) => void }) => {
  return (
    <div className="mb-6">
      <h3 className="mb-2 font-semibold">Conditions</h3>
      <div className="flex items-center gap-2 bg-[#F7F9FF] rounded-md p-2">
        {globalState?.hookUsage[block.id].some(h => h.name === 'onClickEvent') && (
          <ConditionOnClickEditor
            label="On Click Event"
            value={block.conditions?.onClickEvent || []}
            onChange={() => void 0}
          />
        )}

        {globalState?.hookUsage[block.id].some(h => h.name === 'visibility') && (
          <ConditionVisibilityEditor
            value={block.conditions?.visibility || []}
            onChange={value => onUpdate({ ...block, conditions: { ...block.conditions, visibility: value } })}
          />
        )}
      </div>
    </div>
  );
}

const ValidationSection = ({ block, onUpdate }: { block: Block, onUpdate: (block: Block) => void }) => {
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


  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Checkbox
          checked={block.validation?.isRequired ?? false}
          onCheckedChange={(checked) => handleValidationChange('isRequired', !!checked)}
        />
        <Label className="mb-0">Required</Label>
      </div>
    </>
  )
}

export const InteractionSection = ({ globalState, block, onUpdate }: { globalState: GlobalState | null, block: Block, onUpdate: (block: Block) => void }) => {
  return (
    <>
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
    </>
  );
}

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

  if (!block) {
    return <div>
      could not find block
    </div>;
  }


  /**
     * Preserve the order of hooks in the inspector
     */
  let appearanceFound = false;
  let validationFound = false;
  let interactionFound = false;
  let conditionsFound = false;
  const hooks = globalState?.hookUsage[block.id]
    ?.filter((hook: HookUsage) => hook.inspector !== 'hidden')
    ?.filter((hook: HookUsage) => {
      if (hook.type === 'appearance') {
        if (appearanceFound) return false;
        appearanceFound = true;
        return true;
      }
      if (hook.type === 'validation') {
        if (validationFound) return false;
        validationFound = true;
        return true;
      }
      if (hook.type === 'interaction') {
        if (interactionFound) return false;
        interactionFound = true;
        return true;
      }

      if (hook.type === 'conditions') {
        if (conditionsFound) return false;
        conditionsFound = true;
        return true;
      }

      return true;
    });


  return (
    <div className="p-4">
      {block && globalState?.hookUsage?.[block.id] && (
        <div>
          <div className="space-y-4">
            {hooks?.filter((hook: HookUsage) => hook.inspector !== 'hidden')
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
                    />
                  ) : hook.type === 'appearance' ? (
                    <AppearanceEditor globalState={globalState} block={block} onUpdate={onUpdate} />
                  ) : hook.type === 'validation' ? (
                    <ValidationSection block={block} onUpdate={onUpdate} />
                  ) : hook.type === 'interaction' ? (
                    <InteractionSection globalState={globalState} block={block} onUpdate={onUpdate} />
                  ) : hook.type === 'conditions' ? (
                    <ConditionsSection globalState={globalState} block={block} onUpdate={onUpdate} />
                  ) : null}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
};
