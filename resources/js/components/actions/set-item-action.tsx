import { EditProps } from "@/pages/offers/edit";
import { usePage } from "@inertiajs/react";
import { Label } from "@radix-ui/react-label";
import { useMemo, useState } from "react";
import { Combobox } from "../combobox";

export type SetItemActionValue = {
  item: string;
  price: string;
};

interface SetItemActionProps {
  value?: SetItemActionValue;
  onChange: (value: SetItemActionValue) => void;
}

export default function SetItemAction({ value, onChange }: SetItemActionProps) {
  const { offer } = usePage<EditProps>().props;
  const [selectedItem, setSelectedItem] = useState<string>(value?.item || '');

  const offerItemsOptions = useMemo(() => offer.items.map(i => ({
    value: i.id.toString(),
    label: i.name,
  })), [offer]);

  const prices = useMemo(() => {
    return offer.items.find(i => i.id.toString() === selectedItem)?.prices || [];
  }, [offer, selectedItem]);

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
          selected={selectedItem}
          onSelect={(selected) => setSelectedItem(selected as string)}
          placeholder="Select an item"
          modal
          hideSearch
          disabled={offerItemsOptions.length === 1}
        />
      </div>
      <div className="flex flex-row gap-2 items-center">
        <Label>To</Label>
        <Combobox
          className="max-w-[200px]"
          items={priceOptions}
          selected={value?.price}
          onSelect={(selected) => onChange({ item: selectedItem, price: selected as string })}
          placeholder="Select a price"
          modal
          hideSearch
        />
      </div>
    </>
  );
}