import { useEffect, useContext, useState } from 'react';
import { GlobalState, GlobalStateContext } from '@/pages/checkout-main';
import { JSONSchemaEditor } from '@/components/editor/json-schema-editor';
import { Block } from '@/types/offer';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import type { HookUsage } from '@/types/blocks';
import { StringEditor } from '@/components/editor/string-editor';
import { BooleanEditor } from '@/components/editor/boolean-editor';
import { EnumerationEditor } from '@/components/editor/enumeration-editor';
import { FileEditor } from '@/components/editor/file-editor';
import { ColorPickerEditor } from '@/components/editor/color-picker-editor';
import { InteractionEventEditor } from '../editor/interaction-event-editor';
import { ConditionVisibilityEditor, RuleGroup } from '../editor/condition-visibility-editor';
import { useEditor } from '@/contexts/offer/editor-context';
import { getThemeColors } from './page-theme';
import { StyleEditor, StyleItem } from '../editor/style-editor';
import { usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';
import { SpacingEditor } from '../editor/spacing-editor';
import { startCase } from 'lodash';
import { NumberEditor } from '../editor/number-editor';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { BookmarkIcon } from 'lucide-react';
import axios from '@/lib/axios';

interface SaveBlockDialogProps {
  block: Block;
  onSave: (data: { name: string }) => Promise<void>;
  trigger: React.ReactNode;
}

const SaveBlockDialog: React.FC<SaveBlockDialogProps> = ({ block, onSave, trigger }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      // Set default name based on block type
      const blockTypeName = block.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      setName(`${blockTypeName} Block`);
    }
  }, [open, block.type]);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
      });
      setOpen(false);
      setName('');
    } catch (error) {
      console.error('Failed to save block:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Reusable Block</DialogTitle>
          <DialogDescription>
            Save this configured block for reuse across your offers.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="block-name">Name *</Label>
            <Input
              id="block-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter block name"
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!name.trim() || saving}
            >
              {saving ? 'Saving...' : 'Save as Reusable Block'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AppearanceSection = ({ globalState, block, onUpdate }: { globalState: GlobalState | null, block: Block, onUpdate: (block: Block) => void }) => {
  if (!globalState) return null;

  const appearanceHooks = globalState.hookUsage[block.id].filter((hook) => hook.type === 'appearance');

  const onAppearanceChange = (key: string, value: string | RuleGroup | null) => {
    onUpdate({
      ...block,
      appearance: { ...block.appearance, [key]: value }
    });
  }

  return (
    <div className="flex flex-col gap-2 mb-6">
      <h3 className="font-semibold">Appearance</h3>
      {appearanceHooks.map((hook) => {
        return (
          <div key={hook.name}>
            {hook.inspector === 'visibilityPicker' ? (
              <ConditionVisibilityEditor
                key={hook.name}
                value={block.appearance?.visibility?.conditional || []}
                onChange={value => onAppearanceChange('visibility', { conditional: value })}
              />
            ) : hook.inspector === 'spacingPicker' ? (
              <SpacingEditor
                key={hook.name}
                label={hook.label}
                value={block.appearance?.[hook.name]}
                defaultValue={hook.defaultValue}
                defaultThemeKey={hook.name}
                onChangeProperty={value => onAppearanceChange(hook.name, value)}
                config={hook.config}
              />
            ) : (
              <div>
                {hook.name}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const StyleSection = ({ globalState, block, onUpdate }: { globalState: GlobalState | null, block: Block, onUpdate: (block: Block) => void }) => {

  const { fonts } = usePage<EditProps>().props;
  const { theme, setActiveTab,
    setSelectedBlockId,
    setSelectedSectionId} = useEditor();
  const themeColors = getThemeColors(theme);

  if (!globalState) return null;

  const styleHooks = globalState.hookUsage[block.id].filter((hook) => hook.type === 'style');

  const styleItems = styleHooks.map((hook) => ({
    name: hook.name,
    label: hook.label,
    value: block.style?.[hook.name],
    defaultValue: hook.defaultValue,
    inspector: hook.inspector,
    options: hook.options,
    config: hook.config,
  })) as StyleItem[];


  const onStyleChange = (key: string, value: string | boolean) => {
    onUpdate({
      ...block,
      style: { ...block.style, [key]: value }
    });
  };

  const onStyleDelete = (key: string) => {
    onUpdate({
      ...block,
      style: { ...block.style, [key]: undefined }
    });
  };

  function handleNavToTheme() {
    setActiveTab('themes');
    setSelectedBlockId(null);
    setSelectedSectionId(null);
  }

  return (
    <div className="flex flex-col mb-6">
      <h3 className="font-semibold mb-1">Styles</h3>
      <div className="text-xs text-gray-600 mb-3">Styles will override your <span className="text-blue-800 underline cursor-pointer" onClick={handleNavToTheme}>default theme settings</span> </div>
      <StyleEditor
        items={styleItems}
        onChange={onStyleChange}
        onDelete={onStyleDelete}
        themeColors={themeColors}
        fonts={fonts}
      />
    </div>
  )
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
  const interactionHook = globalState?.hookUsage[block.id]?.find((hook) => hook.type === 'interaction' || hook.type === 'eventCallback');
  return (
    <>
      <div className="space-y-4">
        <h3 className="mb-2 font-semibold">Interaction</h3>
        {interactionHook?.events?.map((event) => {
          const { values, options } = event.events.reduce<{
            values: Array<Record<string, any[]>>;
            options: Array<{ value: string; label: string }>;
          }>(
            (acc, e) => ({
              values: [...acc.values, { [e]: block.interaction?.[e] || [] }],
              options: [...acc.options, { value: e, label: e }],
            }),
            { values: [], options: [] }
          );

          return (
            <InteractionEventEditor
              key={event.label}
              label={event.label}
              value={Object.assign({}, ...values)}
              onChange={value => onUpdate({ ...block, interaction: { ...block.interaction, ...value } })}
              elementOptions={(interactionHook?.options ?? []) as Record<'value' | 'label', string>[]}
              events={options}
              required={event.required}
            />
          )
        })}
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
  const { theme } = useEditor();
  const themeColors = getThemeColors(theme);
  // Update local state when incoming block changes

  const handleContentChange = (fieldName: string, value: any) => {
    if (!block) return;
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

  const groupedHooksByGroup = hooks.reduce((acc, hook) => {
    const group = hook.group || 'ungrouped';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(hook);
    return acc;
  }, {} as Record<string, HookUsage[]>);

  // Define the order of sections
  const sectionOrder = [
    { type: 'appearance', label: 'Appearance' },
    { type: 'style', label: 'Style' },
    { type: 'validation', label: 'Validation' },
    { type: 'interaction', label: 'Interaction' },
    { type: 'eventCallback', label: 'Event Callback' },
    { type: 'conditions', label: 'Conditions' },
  ];

  const handleSaveToLibrary = async (data: { name: string }) => {
    try {
      await axios.post('/reusable-blocks', {
        name: data.name,
        block_type: block.type,
        configuration: block,
      });
      // You could add a success notification here
    } catch (error) {
      // You could add an error notification here
      throw error;
    }
  };

  return (
    <div className="p-4">
      {block && globalState?.hookUsage?.[block.id] && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Content</h3>
            <SaveBlockDialog
              block={block}
              onSave={handleSaveToLibrary}
              trigger={
                <Button variant="outline" size="sm" className="gap-2">
                  <BookmarkIcon className="w-4 h-4" />
                  Save to Library
                </Button>
              }
            />
          </div>

          <div className="space-y-4">
            {Object.entries(groupedHooksByGroup).map(([group, hooks]) => {
              // Skip hooks that are handled by special sections
              const filteredHooks = hooks.filter(hook =>
                !['appearance', 'style', 'validation', 'interaction', 'conditions', 'eventCallback'].includes(hook.type)
              );

              if (filteredHooks.length === 0) return null;

              return (
                <div key={group} className="space-y-2">
                  <div className="text-sm font-semibold">{group === 'ungrouped' ? '' : startCase(group)}</div>
                  <div className="flex flex-col gap-2 h-full rounded-md xp-2 pr-2 bordxer xbg-[#F7F9FF]">
                    {filteredHooks.map((hook: HookUsage) => (
                      <div key={hook.name}>
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
                            validations={hook.config?.validations}
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
                            options={Array.isArray(hook.options) ?
                              hook.options.map(opt => typeof opt === 'string' ? opt : opt.value)
                              : []
                            }
                            icons={hook.icons}
                            inspector={hook.inspector}
                            labels={hook.labels}
                          />
                        ) : hook.type === 'number' ? (
                          <NumberEditor
                            label={hook.label || hook.name}
                            value={block.content?.[hook.name] ?? hook.defaultValue}
                            onChange={value => handleContentChange(hook.name, value)}
                          />
                        ) : hook.type === 'jsonSchema' && hook.schema ? (
                          <JSONSchemaEditor
                            schema={hook.schema}
                            value={block.content?.[hook.name] ?? hook.defaultValue}
                            onChange={newValue => handleContentChange(hook.name, newValue)}
                            themeColors={themeColors}
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {sectionOrder.map(({ type, label }) => {
              const sectionHooks = groupedHooks[type] || [];
              if (sectionHooks.length === 0) return null;

              return (
                <div key={type} className="space-y-4">
                  {type === 'appearance' ? (
                    <AppearanceSection globalState={globalState} block={block} onUpdate={onUpdate} />
                  ) : type === 'style' ? (
                    <StyleSection globalState={globalState} block={block} onUpdate={onUpdate} />
                  ) : type === 'validation' ? (
                    <ValidationSection block={block} onUpdate={onUpdate} />
                  ) : type === 'interaction' || type === 'eventCallback' ? (
                    <InteractionSection globalState={globalState} block={block} onUpdate={onUpdate} />
                  ) : type === 'conditions' ? (
                    <ConditionsSection globalState={globalState} block={block} onUpdate={onUpdate} />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
};
