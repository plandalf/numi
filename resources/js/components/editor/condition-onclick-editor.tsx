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

const ACTION_OPTIONS = [
  { value: 'set_price', label: 'Set the price to' },
];

interface OnClickAction {
  action: string;
  priceId: string;
}

interface ActionOnClickEditorProps {
  label: string;
  value: OnClickAction[];
  onChange: (value: OnClickAction[]) => void;
}

export const AddOnClickAction: React.FC<ActionOnClickEditorProps> = ({ label, value, onChange }) => {
  const [open, setOpen] = useState(false);
  const [actions, setActions] = useState<OnClickAction[]>(
    value.length > 0 ? value : [{ action: ACTION_OPTIONS[0].value, priceId: '' }]
  );
  const context = useContext(GlobalStateContext);
  const offer: Offer | undefined = context && 'offer' in context ? (context as any).offer : undefined;

  // Gather all prices from all slots
  const priceOptions = useMemo(() => {
    if (!offer?.slots) return [];
    const prices: Price[] = offer.slots.flatMap(slot => slot.price || []);
    // Remove duplicates by id
    const seen = new Set<number>();
    return prices.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    }).map(p => ({
      value: p.id.toString(),
      label: `${p.name || p.lookup_key || p.id} (${p.currency.toUpperCase()} ${p.amount / 100})`,
    }));
  }, [offer]);

  const handleFieldChange = (idx: number, field: keyof OnClickAction, fieldValue: string) => {
    const updated = actions.map((item, i) =>
      i === idx ? { ...item, [field]: fieldValue } : item
    );
    setActions(updated);
    onChange(updated);
  };

  const handleAdd = () => {
    const updated = [...actions, { action: ACTION_OPTIONS[0].value, priceId: '' }];
    setActions(updated);
    onChange(updated);
  };

  const handleDelete = (idx: number) => {
    const updated = actions.filter((_, i) => i !== idx);
    setActions(updated);
    onChange(updated);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full bg-gray-900 text-white hover:bg-gray-800">OnClick</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit OnClick Actions</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {actions.map((act, idx) => (
            <div key={idx} className="space-y-2 border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
              <div className="flex flex-row gap-2 items-center">
                <Label className="mb-2 block">Action</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      {ACTION_OPTIONS.find(opt => opt.value === act.action)?.label || 'Action...'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {ACTION_OPTIONS.map(opt => (
                      <DropdownMenuItem key={opt.value} onClick={() => handleFieldChange(idx, 'action', opt.value)}>
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* Select price dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full">
                      {priceOptions.find(opt => opt.value === act.priceId)?.label || 'Select price...'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {priceOptions.length > 0 ? (
                      priceOptions.map(opt => (
                        <DropdownMenuItem key={opt.value} onClick={() => handleFieldChange(idx, 'priceId', opt.value)}>
                          {opt.label}
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="p-2 text-muted-foreground text-sm">No prices available</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
          <Button variant="outline" className="mt-4 w-full">Done</Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export const ConditionOnClickEditor: React.FC<ActionOnClickEditorProps> = (props) => {
  return <AddOnClickAction {...props} />;
};
