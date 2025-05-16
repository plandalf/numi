import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../ui/dialog';
import { Trash2 } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';
import { Combobox } from '../combobox';
import SetItemAction, { SetItemActionValue } from '../actions/set-item-action';

const ACTION_OPTIONS = [
  { value: 'setItem', label: 'Set line item' }
];

type OnClickActionValue = SetItemActionValue | string;

export type CallbackType = 'onClick' | 'onChange' | 'onTabChange';
export interface OnClickAction {
  action: string;
  element: string;
  value: OnClickActionValue;
}

interface ActionEditorProps {
  label: string;
  value: OnClickAction[];
  onChange: (value: OnClickAction[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  elementOptions?: Record<'value' | 'label', string>[];
}

interface ActionSelectorProps {
  action: string;
  value: OnClickActionValue;
  onChange: (value: OnClickActionValue) => void;
}

function ActionSelector({ action, value, onChange }: ActionSelectorProps) {
  switch (action) {
    case 'setItem':
      return <SetItemAction value={value as SetItemActionValue} onChange={onChange} />;
    default:
      return null;
  }
}

export const AddActionDialog: React.FC<ActionEditorProps> = ({ label, value, onChange, open, onOpenChange, elementOptions }) => {
  const defaultValue = value.length > 0 ? value.map(v => ({ ...v, action: v.action || ACTION_OPTIONS[0].value })) : [{ action: ACTION_OPTIONS[0].value, element: '', value: '' }];
  const [actions, setActions] = useState<OnClickAction[]>(defaultValue);

  console.log("element options", elementOptions);
  const handleFieldChange = (idx: number, field: keyof OnClickAction, fieldValue: OnClickActionValue) => {
    const updated = actions.map((item, i) =>
      i === idx ? { ...item, [field]: fieldValue } : item
    );

    console.log('updated actions', updated);
    setActions(updated);
  };

  const handleAdd = () => {
    const updated = [...actions, { action: ACTION_OPTIONS[0].value, element: '', value: '' }];
    setActions(updated);
  };

  const handleDelete = (idx: number) => {
    const updated = actions.filter((_, i) => i !== idx);
    setActions(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:min-w-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit {label} Actions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {actions.map((act, idx) => (
            <div key={idx} className="flex flex-col items-center ">
              <div className="flex flex-col border-b gap-2 p-4 mb-4 bg-[#F7F9FF] w-full rounded-md border">
                <div className="flex flex-row justify-between w-full">
                  <div className="flex flex-row flex-wrap gap-2 items-center w-full">
                  <Label className="block">{label}</Label>
                  <Combobox
                    items={elementOptions ?? []}
                    selected={act.element}
                    className="max-w-[200px]"
                    onSelect={(selected) => handleFieldChange(idx, 'element', selected as string)}
                    placeholder="Element..."
                    hideSearch
                    modal
                  />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => handleDelete(idx)}
                    aria-label="Delete action"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-row flex-wrap gap-2 items-center w-full">
                  <Label className="block">Action</Label>
                  <Combobox
                    items={ACTION_OPTIONS}
                    selected={'setItem'}
                    className="max-w-[200px]"
                    onSelect={(selected) => handleFieldChange(idx, 'action', selected as string)}
                    placeholder="Action..."
                    hideSearch
                    modal
                    disabled //right now we only have one action
                  />
                  <ActionSelector
                    action={act.action}
                    value={act.value}
                    onChange={(value) => handleFieldChange(idx, 'value', value)}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={handleAdd} className="mt-2">Add another action</Button>
        </div>
        <DialogClose asChild>
          <Button variant="outline" className="mt-4 w-full" onClick={() => onChange(actions)}>Save</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export const InteractionEventEditor: React.FC<Pick<ActionEditorProps, 'label' | 'value' | 'onChange' | 'elementOptions'>> = ({ label, value, onChange, elementOptions }) => {
  const [open, setOpen] = useState(false);
  const [selectedActions, setSelectedActions] = useState<OnClickAction[]>(value || [{ action: '', element: '', value: '' }]);
  const [selectedActionIndex, setSelectedActionIndex] = useState<number>();

  const { offer } = usePage<EditProps>().props;

  const getActionDescription = (action: OnClickAction) => {
    if (!action.action) return null;

    if (action.action === 'setItem') {
      if (action.value) {
        const value = action.value as SetItemActionValue;
        const item = offer.items.find(i => i.id.toString() === value.item);
        if (item) {
          return `${action.element}: Set ${item.name} to ${value.price}`;
        }
        return `Set line item to ${value.price}`;
      } else if (action.element) {
        const element = elementOptions?.find(e => e.value === action.element);
        if (element) {
          return `You need to set ${element.label} a line item`;
        }
      }

      return 'Set line item';
    }

    if (action.action === 'other_action') {
      return 'Other action';
    }

    return action.action;
  };

  const handleOnItemClick = (index: number, action: OnClickAction) => {
    console.log('action selection index', index, action);
    setSelectedActions([action]);
    setSelectedActionIndex(index);
    setOpen(true);
  }

  const handleOnDialogChange = (open: boolean) => {
    setOpen(open);
    setSelectedActions([{ action: '', element: '', value: '' }]);
    setSelectedActionIndex(undefined);
  }

  const handleOnSave = (actions: OnClickAction[]) => {
    if (selectedActionIndex !== undefined) {
      const updated = [...value];
      updated[selectedActionIndex] = actions[0];
      onChange(updated);
    } else {
      onChange([...value, ...actions].filter(action => action));
    }
    handleOnDialogChange(false);
  }

  const handleOnCreate = () => {
    setOpen(true);
    setSelectedActions([{ action: '', element: '', value: '' }]);
  }

  return (
    <div className='flex flex-col gap-2'>
      {value.length > 0 && (
        <div className="mb-2 space-y-1">
          {value.map((action, index) => {
            if (!action) return null;
            const description = getActionDescription(action);
            return description ? (
              <div key={index} className="text-sm text-gray-700 p-1 hover:bg-gray-200 bg-gray-100 rounded-sm border p-2 cursor-pointer" onClick={() => handleOnItemClick(index, action)}>
                {description}
              </div>
            ) : null;
          })}
        </div>
      )}
      <Button variant="secondary" className="w-full bg-gray-900 text-white hover:bg-gray-800" onClick={handleOnCreate}>{label}</Button>
      {open && <AddActionDialog label={label} value={selectedActions} elementOptions={elementOptions} onChange={handleOnSave} open onOpenChange={handleOnDialogChange} />}
    </div>
  );
};
