import React, { useContext, useState, useMemo } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../ui/dialog';
import { Trash2 } from 'lucide-react';
import { GlobalStateContext } from '@/pages/checkout-main';
import { type Price, type Offer } from '@/types/offer';
import { usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';
import { Combobox } from '../combobox';

const ACTION_OPTIONS = [
  { value: 'set_price', label: 'Set the price to' },
  { value: 'other_action', label: 'Other Action' }
];

export interface OnClickAction {
  action: string;
  element: string;
  value: string;
}

interface ActionOnClickEditorProps {
  label: string;
  value: OnClickAction[];
  onChange: (value: OnClickAction[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OptionSelectorProps {
  action: string;
  value: string;
  onChange: (value: string) => void;
}

function OptionSelector({ action, value, onChange }: OptionSelectorProps) {
  const { offer } = usePage<EditProps>().props;

  if (action === 'set_price') {
    const prices = offer.items.flatMap(i => i.prices || []);
    const priceOptions = prices.map(p => ({
      value: p.lookup_key || p.id.toString(),
      label: `${p.name || p.lookup_key || p.id} (${p.currency.toUpperCase()} ${p.amount / 100})`,
    }));

    return (
      <div className="flex flex-row gap-2 items-center">
        <Label>Price</Label>
        <Combobox
          className="max-w-[200px]"
          items={priceOptions}
          selected={value}
          onSelect={(selected) => onChange(selected as string)}
          placeholder="Select a price"
          modal
          hideSearch
        />
      </div>
    );
  }

  return (
    <div></div>
  );
}

export const AddOnClickActionDialog: React.FC<ActionOnClickEditorProps> = ({ label, value, onChange, open, onOpenChange }) => {
  const [actions, setActions] = useState<OnClickAction[]>(value.length > 0 ? value : [{ action: '', element: '', value: '' }]);

  const handleFieldChange = (idx: number, field: keyof OnClickAction, fieldValue: string) => {
    const updated = actions.map((item, i) =>
      i === idx ? { ...item, [field]: fieldValue } : item
    );
    setActions(updated);
  };

  const handleAdd = () => {
    const updated = [...actions, { action: '', element: '', value: '' }];
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
          <DialogTitle>Edit OnClick Actions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {actions.map((act, idx) => (
            <div key={idx} className="flex flex-col items-center ">
              <div className="flex flex-col items-center border-b gap-2 p-4 mb-4 bg-[#F7F9FF] w-full rounded-md border sm:flex-row">
                <div className="flex flex-row gap-2 items-center w-full">
                  <Label className="block">Action</Label>
                  <Combobox
                    items={ACTION_OPTIONS}
                    selected={act.action}
                    className="max-w-[200px]"
                    onSelect={(selected) => handleFieldChange(idx, 'action', selected as string)}
                    placeholder="Action..."
                    hideSearch
                    modal
                  />
                </div>
                <div className="flex flex-row gap-2 items-center w-full">
                  <OptionSelector
                    action={act.action}
                    value={act.value}
                    onChange={(value) => handleFieldChange(idx, 'value', value)}
                  />
                </div>
                {/* Delete button */}
                {actions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2"
                    onClick={() => handleDelete(idx)}
                    aria-label="Delete action"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
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

export const ConditionOnClickEditor: React.FC<Pick<ActionOnClickEditorProps, 'label' | 'value' | 'onChange'>> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [selectionActions, setSelectionAction] = useState<OnClickAction[]>(value || [{ action: '', element: '', value: '' }]);

  const { offer } = usePage<EditProps>().props;

  const getActionDescription = (action: OnClickAction) => {
    if (!action.action) return null;

    if (action.action === 'set_price' && action.value) {
      const prices = offer.products.flatMap(p => p.prices || []);
      const price = prices.find(p => (p.lookup_key || p.id.toString()) === action.value);
      if (price) {
        return `Set price to ${price.name || price.lookup_key || price.id} (${price.currency.toUpperCase()} ${price.amount / 100})`;
      }
      return `Set price to ${action.value}`;
    }

    if (action.action === 'other_action') {
      return 'Other action';
    }

    return action.action;
  };

  const handleOnItemClick = (action: OnClickAction) => {
    setSelectionAction([action]);
    setOpen(true);
  }

  const handleOnDialogChange = (open: boolean) => {
    setOpen(open);
    setSelectionAction([{ action: '', element: '', value: '' }]);
  }

  const handleOnSave = (actions: OnClickAction[]) => {
    console.log('actions', actions);
    setSelectionAction([{ action: '', element: '', value: '' }]);
    setOpen(false);
    onChange(actions);
  }

  return (
    <div className='flex flex-col gap-2'>
      {value.length > 0 && value[0].action && (
        <div className="mb-2 space-y-1">
          {value.map((action, index) => {
            const description = getActionDescription(action);
            return description ? (
              <div key={index} className="text-sm text-gray-700 p-1 hover:bg-gray-200 bg-gray-100 rounded-sm border p-2 cursor-pointer" onClick={() => handleOnItemClick(action)}>
                {description}
              </div>
            ) : null;
          })}
        </div>
      )}
      <Button variant="secondary" className="w-full bg-gray-900 text-white hover:bg-gray-800" onClick={() => setOpen(true)}>OnClick</Button>
      {open && <AddOnClickActionDialog label={label} value={selectionActions} onChange={handleOnSave} open onOpenChange={handleOnDialogChange} />}
    </div>
  );
};
