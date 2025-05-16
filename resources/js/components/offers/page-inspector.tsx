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
import { ConditionOnClickEditor } from '../editor/condition-onclick-editor';
import { ConditionVisibilityEditor } from '../editor/condition-visibility-editor';
import { useEditor } from '@/contexts/offer/editor-context';
import { getThemeColors } from './page-theme';
import { StyleEditor, StyleItem } from '../editor/style-editor';
import { usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';

export const AppearanceEditor = ({ globalState, block, onUpdate }: { globalState: GlobalState | null, block: Block, onUpdate: (block: Block) => void }) => {
  
  const { fonts } = usePage<EditProps>().props;
  const { data } = useEditor();
  const themeColors = getThemeColors(data.theme);
  
  if (!globalState) return null;

  const appearanceHooks = globalState.hookUsage[block.id].filter((hook) => hook.type === 'appearance' && hook.name !== 'visibility');

  const visibilityHook = globalState.hookUsage[block.id].find((hook) => hook.name === 'visibility');

  const styleItems = appearanceHooks.map((hook) => ({
    name: hook.name,
    label: hook.label,
    value: block.appearance?.[hook.name],
    defaultValue: hook.defaultValue,
    inspector: hook.inspector,
    options: hook.options,
    config: hook.config,
  })) as StyleItem[];


  const onStyleChange = (key: string, value: string | boolean) => {
    onUpdate({
      ...block,
      appearance: { ...block.appearance, [key]: value }
    });
  };

  const onStyleDelete = (key: string) => {
    onUpdate({
      ...block,
      appearance: { ...block.appearance, [key]: undefined }
    });
  };

  return (
    <div className="flex flex-col gap-3 mb-6">
      <h3 className="font-semibold">Appearance</h3>
      <Label className="text-sm">Styles</Label>
      <StyleEditor
        items={styleItems}
        onChange={onStyleChange}
        onDelete={onStyleDelete}
        themeColors={themeColors}
        fonts={fonts}
      />
      {visibilityHook && (
        <ConditionVisibilityEditor
          value={block.appearance?.visibility?.conditional || []}
          onChange={value => onUpdate({ ...block, appearance: { ...block.appearance, visibility: { conditional: value } } })}
        />
      )}
    </div>
  );
}

export const ConditionsSection = ({ globalState, block, onUpdate }: { globalState: GlobalState | null, block: Block, onUpdate: (block: Block) => void }) => {
  if (globalState?.hookUsage[block.id].some(h => h.name === 'visibility')) {
    console.log("albbert", block);
  }
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

  const themeColors = getThemeColors(data.theme);

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
  const { data } = useEditor();
  const themeColors = getThemeColors(data.theme);
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

  const hooks = globalState?.hookUsage[block.id]?.filter((hook: HookUsage) => hook.inspector !== 'hidden') || [];

  // Group hooks by type
  const groupedHooks = hooks.reduce((acc, hook) => {
    if (!acc[hook.type]) {
      acc[hook.type] = [];
    }
    acc[hook.type].push(hook);
    return acc;
  }, {} as Record<string, HookUsage[]>);

  // Define the order of sections
  const sectionOrder = [
    { type: 'other', label: 'Properties' },
    { type: 'appearance', label: 'Appearance' },
    { type: 'validation', label: 'Validation' },
    { type: 'interaction', label: 'Interaction' },
    { type: 'conditions', label: 'Conditions' }
  ];

  return (
    <div className="p-4">
      {block && globalState?.hookUsage?.[block.id] && (
        <div>
          <div className="space-y-6">
            {sectionOrder.map(({ type, label }) => {
              // For 'other' type, combine all non-special types
              const sectionHooks = type === 'other' 
                ? hooks.filter(hook => !['appearance', 'validation', 'interaction', 'conditions'].includes(hook.type))
                : groupedHooks[type] || [];

              if (sectionHooks.length === 0) return null;

              return (
                <div key={type} className="space-y-4">
                  {type === 'appearance' ? (
                    <AppearanceEditor globalState={globalState} block={block} onUpdate={onUpdate} />
                  ) : type === 'validation' ? (
                    <ValidationSection block={block} onUpdate={onUpdate} />
                  ) : type === 'interaction' ? (
                    <InteractionSection globalState={globalState} block={block} onUpdate={onUpdate} />
                  ) : type === 'conditions' ? (
                    <ConditionsSection globalState={globalState} block={block} onUpdate={onUpdate} />
                  ) : (
                    <>
                      <h3 className="font-semibold">{label}</h3>
                      {sectionHooks.map((hook: HookUsage) => (
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
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
};
