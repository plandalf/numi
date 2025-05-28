import { EditProps } from "@/pages/offers/edit";
import { usePage } from "@inertiajs/react";
import { Label } from "@radix-ui/react-label";
import { useEffect, useMemo, useRef } from "react";
import { Combobox } from "../combobox";
import { Input } from "../ui/input";

export type SetItemActionValue = {
  item?: string;
  price?: string;
  required?: boolean;
  quantity?: number;
};

interface SetItemActionProps {
  value?: SetItemActionValue;
  onChange: (value: SetItemActionValue) => void;
  action: 'setItem' | 'setLineItemQuantity' | 'changeLineItemPrice' | 'deactivateLineItem';
}

export default function SetItemAction({ value = {}, onChange, action }: SetItemActionProps) {
  const { offer } = usePage<EditProps>().props;
  const prevActionRef = useRef(action);

  const offerItemsOptions = useMemo(() => offer.items.map(i => ({
    value: i.id.toString(),
    label: i.name,
  })), [offer]);

  const prices = useMemo(() => {
    return offer.items.find(i => i.id.toString() === value?.item)?.prices || [];
  }, [offer, value?.item]);

  const priceOptions = useMemo(() => {
    return prices.map(p => ({
      value: p.lookup_key!,
      label: `${p.name || p.lookup_key || p.id} (${p.currency.toUpperCase()} ${p.amount / 100})`,
    }));
  }, [prices]);

  useEffect(() => {
    if(action === 'deactivateLineItem') {
      onChange({ required: false });
    }
  }, [action]);

  useEffect(() => {
    // Only reset if action has changed
    if (prevActionRef.current !== action || !prevActionRef.current) {
      // Determine the desired reset state based on action
      const resetState = (() => {
        switch (action) {
          case 'deactivateLineItem':
            return { required: false };
          case 'setItem':
            return {};
          case 'setLineItemQuantity':
            return {};
          case 'changeLineItemPrice':
            return {};
          default:
            return {};
        }
      })();

      onChange(resetState);
      prevActionRef.current = action;
    }
  }, [action, onChange]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <Label className="text-sm font-semibold">Options</Label>
      <div className="flex flex-row gap-4 items-center w-full">
        <Label className="text-sm w-16">Line Item</Label>
        <Combobox
          className="w-[300px]"
          items={offerItemsOptions}
          selected={value?.item}
          onSelect={(selected) => onChange({ ...value, item: selected as string })}
          placeholder="Select an item"
          hideSearch
        />
      </div>
      {(action === 'setItem' || action === 'changeLineItemPrice' || action === 'setLineItemQuantity') && (
        <div className="flex flex-row gap-4 items-center w-full">
          <Label className="text-sm w-16">Price</Label>
          <Combobox
            className="w-[300px]"
            items={priceOptions}
            selected={value?.price}
            onSelect={(selected) => onChange({ ...value, price: selected as string })}
            placeholder="Select a price"
            hideSearch
          />
        </div>
      )}
      {(action === 'setLineItemQuantity' || action === 'setItem') && (
        <div className="flex flex-row gap-4 items-center w-full">
          <Label className="text-sm w-16">Quantity</Label>
          <Input
            className="bg-white w-[300px]"
            type="number"
            value={value?.quantity}
            onChange={(e) => onChange({ ...value, quantity: parseInt(e.target.value) })}
          />
        </div>
      )}
      {(action === 'setItem' || action === 'deactivateLineItem') && (
        <div className="flex flex-row gap-4 items-center w-full">
          <Label className="text-sm w-16">Required?</Label>
          <Combobox
            className="w-[300px]"
            items={[{ value: '', label: 'Unset' }, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
            selected={typeof value?.required === 'boolean' ? value?.required ? 'true' : 'false' : ''}
            onSelect={(selected) => onChange({ ...value, required: selected === '' ? undefined : selected === 'true' })}
            placeholder="Select an option"
            disabled={action === 'deactivateLineItem'}
            hideSearch
          />
        </div>
      )}
    </div>
  );
}