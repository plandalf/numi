import React, { useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/combobox';
import { usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';
import axios from '@/lib/axios';

export type SwitchProductActionValue = {
  item: string; // offer item id (string)
  productId?: string; // target catalog product id
};

export default function SwitchProductAction({ value, onChange }: { value: SwitchProductActionValue; onChange: (value: SwitchProductActionValue) => void }) {
  const { offer } = usePage<EditProps>().props;
  const offerItemsOptions = useMemo(() => offer.items.map(i => ({
    value: i.id.toString(),
    label: i.name,
  })), [offer]);

  const [productOptions, setProductOptions] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async (search?: string) => {
      const res = await axios.get('/api/products', {
        params: search && search.length > 0 ? { search } : undefined,
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      const rows: Array<{ id: number; name: string }> = res.data;
      setProductOptions(rows.map(r => ({ value: String(r.id), label: r.name })));
    };
    load();
    return () => controller.abort();
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-4 w-full">
        <Label className="text-sm w-24">Line Item</Label>
        <Combobox
          className="w-[300px]"
          items={offerItemsOptions}
          selected={value?.item || ''}
          onSelect={(selected) => onChange({ ...value, item: selected as string })}
          placeholder="Select a line item"
          hideSearch
        />
      </div>
      <div className="flex items-center gap-4 w-full">
        <Label className="text-sm w-24">Product</Label>
        <Combobox
          className="w-[300px]"
          items={productOptions}
          selected={value?.productId || ''}
          onSelect={(selected) => onChange({ ...value, productId: selected as string })}
          placeholder="Select a product"
          hideSearch
        />
      </div>
    </div>
  );
}


