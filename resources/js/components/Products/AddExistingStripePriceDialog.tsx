import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { toast } from 'sonner';
import { PriceStep } from './AddExistingStripeProductDialog';
import { Product } from '@/types/product';

interface AddExistingStripeProductDialogProps {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  product: Product;
}

export default function AddExistingStripePriceDialog({
  onOpenChange,
  open = false,
  product
}: AddExistingStripeProductDialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
  };

  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const handleSave = () => {
    const body = {
      gateway_prices: selectedPrices,
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
        <PriceStep
          integrationId={product.integration_id!}
          productId={product.gateway_product_id!}
          selectedPrices={selectedPrices}
          setSelectedPrices={setSelectedPrices}
          onClickSave={handleSave}
          onClickBack={() => void 0}
        />
    </Dialog>
  );
}
