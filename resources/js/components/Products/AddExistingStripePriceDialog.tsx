import {
  Dialog,
  DialogContent, DialogDescription, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { PriceStep } from './AddExistingStripeProductDialog';
import { Product } from '@/types/product';
import { Label } from '@/components/ui/label';
import { Combobox } from '@/components/combobox';

interface AddExistingStripeProductDialogProps {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  product: Product;
  listPrices?: Array<{ id: number; name?: string | null; amount: number; currency: string; type: string; is_active: boolean }>
}

export default function AddExistingStripePriceDialog({
  onOpenChange,
  open = false,
  product,
  listPrices = []
}: AddExistingStripeProductDialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
  };

  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [parentListPriceId, setParentListPriceId] = useState<number | null>(null);

  const handleSave = () => {
    const body: Record<string, unknown> = {
      gateway_prices: selectedPrices,
    };

    if (parentListPriceId) {
      body.parent_list_price_id = parentListPriceId;
      body.scope = 'variant';
    } else {
      body.scope = 'list';
    }

    const toastId = toast.loading(`Creating prices...`);

    router.post(route("products.prices.import", { product: product.id }), body, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`Prices created successfully`, { id: toastId });
        handleOpenChange(false);
      },
      onError: (errors) => {
        toast.error(`Failed to create product: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <div className="flex flex-col gap-3">
          {Array.isArray(listPrices) && listPrices.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label>Parent List Price (optional)</Label>
              <Combobox
                className="mt-1 w-full"
                items={listPrices.map((p) => ({
                  value: p.id.toString(),
                  label: p.name || `Price #${p.id}`,
                }))}
                placeholder="Select a base list price (optional)"
                selected={parentListPriceId ? String(parentListPriceId) : ''}
                onSelect={(value) => setParentListPriceId(value ? parseInt(value as string) : null)}
              />
              <p className="text-xs text-muted-foreground">If selected, imported Stripe prices will be created as variants under this list price.</p>
            </div>
          )}

          <PriceStep
            integrationId={product.integration?.id!}
            productId={product.gateway_product_id!}
            selectedPrices={selectedPrices}
            setSelectedPrices={setSelectedPrices}
            onClickSave={handleSave}
            onClickBack={() => handleOpenChange(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
