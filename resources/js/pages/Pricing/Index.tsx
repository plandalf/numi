import { Head, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { type Product as OfferProduct, type Price } from '@/types/offer';
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatMoney } from "@/lib/utils";

interface PageProps {
  products: OfferProduct[];
  filters?: { at?: string; currency?: string; interval?: 'month'|'year' };
}

export default function PricingIndex() {
  const { products, filters } = usePage<PageProps>().props;
  const allIntervals = Array.from(new Set((products || []).flatMap(p => (p.prices||[]).map(pr => pr.renew_interval).filter(Boolean)))) as Array<'day'|'week'|'month'|'year'>;
  const allCurrencies = Array.from(new Set((products || []).flatMap(p => (p.prices||[]).map(pr => pr.currency?.toLowerCase?.()).filter(Boolean) as string[])));
  const [interval, setInterval] = useState<'day'|'week'|'month'|'year'>(filters?.interval as any || (allIntervals[0] || 'month'));
  const [currency, setCurrency] = useState<string>(filters?.currency || (allCurrencies[0] || 'usd'));

  const visible = useMemo(() => {
    return (products || []).map((p) => ({
      ...p,
      prices: (p.prices || []).filter((price: Price) => {
        const ok = price.renew_interval === interval && price.currency?.toLowerCase?.() === currency;
        const from = (price as any).activated_at ? new Date((price as any).activated_at) : null;
        const until = (price as any).deactivated_at ? new Date((price as any).deactivated_at) : null;
        const at = filters?.at ? new Date(filters.at) : new Date();
        const activeAt = (!from || from <= at) && (!until || until > at);
        return ok && activeAt;
      })
    })).filter(p => p.prices && p.prices.length > 0);
  }, [products, interval, currency]);

  return (
    <AppLayout>
      <Head title="Pricing" />
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">Pricing</h1>
            <p className="text-sm text-muted-foreground">Browse active plans with monthly/yearly toggle and currency.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Interval:</span>
              {(['day','week','month','year'] as const).filter(i => allIntervals.includes(i)).map(i => (
                <Button key={i} variant={interval===i ? 'default' : 'outline'} size="sm" onClick={() => setInterval(i)}>
                  {i[0].toUpperCase()+i.slice(1)}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Currency:</span>
              <div className="flex flex-wrap gap-2">
                {allCurrencies.map(c => (
                  <Button key={c} variant={currency===c ? 'default' : 'outline'} size="sm" onClick={() => setCurrency(c)}>
                    {c.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((product) => (
            <div key={product.id} className="rounded-xl p-6 bg-white shadow-sm border border-gray-100 flex flex-col">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Plan</div>
                <div className="text-lg font-medium mb-2">{product.name}</div>
                <div className="space-y-2">
                  {product.prices!.map((price) => (
                    <div key={price.id} className="flex items-center justify-between text-sm">
                      <div>{price.name || price.lookup_key}</div>
                      <div className="font-semibold">{formatMoney(price.amount, price.currency)} / {price.renew_interval}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4">
                <Button className="w-full">Choose {product.name}</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}


