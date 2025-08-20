import React, { useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/combobox';
import { usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';
import axios from '@/lib/axios';

export type SwitchVariantActionValue = {
  item: string; // offer item id (string)
  interval?: 'day' | 'week' | 'month' | 'year';
  type?: 'recurring' | 'one_time';
  currency?: string; // 'session' or ISO code lowercase
};

export default function SwitchVariantAction({ value, onChange }: { value: SwitchVariantActionValue; onChange: (value: SwitchVariantActionValue) => void }) {
  const { offer } = usePage<EditProps>().props;
  const offerItemsOptions = useMemo(() => offer.items.map(i => ({
    value: i.id.toString(),
    label: i.name,
  })), [offer]);

  // Product switching is now handled by SwitchProductAction

  const intervalOptions = [
    { value: 'day', label: 'Daily' },
    { value: 'week', label: 'Weekly' },
    { value: 'month', label: 'Monthly' },
    { value: 'year', label: 'Yearly' },
  ];

  const typeOptions = [
    { value: 'recurring', label: 'Recurring' },
    { value: 'one_time', label: 'One-time' },
  ];

  const currencyOptions = [
    { value: 'session', label: 'Use session currency' },
    { value: 'usd', label: 'USD' },
    { value: 'gbp', label: 'GBP' },
    { value: 'eur', label: 'EUR' },
    { value: 'aud', label: 'AUD' },
    { value: 'nzd', label: 'NZD' },
    { value: 'cad', label: 'CAD' },
    { value: 'jpy', label: 'JPY' },
  ];

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
        <Label className="text-sm w-24">Type</Label>
        <Combobox
          className="w-[220px]"
          items={typeOptions}
          selected={value?.type || 'recurring'}
          onSelect={(v) => onChange({ ...value, type: (v as 'recurring' | 'one_time') })}
          hideSearch
        />
      </div>
      <div className="flex items-center gap-4 w-full">
        <Label className="text-sm w-24">Interval</Label>
        <Combobox
          className="w-[220px]"
          items={intervalOptions}
          selected={value?.interval || 'month'}
          onSelect={(v) => onChange({ ...value, interval: (v as 'day' | 'week' | 'month' | 'year') })}
          hideSearch
        />
      </div>
      <div className="flex items-center gap-4 w-full">
        <Label className="text-sm w-24">Currency</Label>
        <Combobox
          className="w-[260px]"
          items={currencyOptions}
          selected={value?.currency || 'session'}
          onSelect={(v) => onChange({ ...value, currency: String(v) })}
          hideSearch
        />
      </div>
    </div>
  );
}


