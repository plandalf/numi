import { EditProps } from "@/pages/offers/edit";
import { usePage } from "@inertiajs/react";
import { Label } from "@radix-ui/react-label";
import { useMemo, useState } from "react";
import { Combobox } from "../combobox";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";

export type SetItemActionValue = {
  item?: string;
  price?: string;
  required?: boolean;
  quantity?: number;
};

interface SetItemActionProps {
  value?: SetItemActionValue;
  onChange: (value: SetItemActionValue) => void;
}

export default function SetItemAction({ value = {}, onChange }: SetItemActionProps) {
  const { offer } = usePage<EditProps>().props;

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

  return (
    <>
      <div className="flex flex-row gap-2 items-center">
        <Combobox
          className="max-w-[200px]"
          items={offerItemsOptions}
          selected={value?.item}
          onSelect={(selected) => onChange({ ...value, item: selected as string })}
          placeholder="Select an item"
          modal
          hideSearch
        />
      </div>
      <div className="flex flex-row gap-2 items-center">
        <Label>To</Label>
        <Combobox
          className="max-w-[200px]"
          items={priceOptions}
          selected={value?.price}
          onSelect={(selected) => onChange({ ...value, price: selected as string })}
          placeholder="Select a price"
          modal
          hideSearch
        />
      </div>
      <div className="flex flex-row gap-2 items-center">
        <Label>Quantity</Label>
        <Input
          className="bg-white"
          type="number"
          value={value?.quantity}
          onChange={(e) => onChange({ ...value, quantity: parseInt(e.target.value) })}
        />
      </div>
      <div className="flex flex-row gap-2 items-center">
        <Label>Required?</Label>
        <Combobox
          className="max-w-[200px]"
          items={[{ value: '', label: 'Unset' }, { value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }]}
          selected={typeof value?.required === 'boolean' ? value?.required ? 'true' : 'false' : ''}
          onSelect={(selected) => onChange({ ...value, required: selected === '' ? undefined : selected === 'true' })}
          placeholder="Select an option"
          modal
          hideSearch
        />
      </div>
    </>
  );
}