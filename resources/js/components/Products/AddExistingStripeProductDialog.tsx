import { Link } from '@inertiajs/react';
import { Boxes, CircleCheck, CircleChevronRight, Plus, Trash, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState, useEffect, useMemo } from 'react';
import { router } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { Combobox } from '@/components/combobox';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Integration } from '@/types/integration';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatMoney } from '@/lib/utils';
import { toast } from 'sonner';

interface AddExistingStripeProductDialogProps {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  integrationId?: number;
  integrations: Integration[];
}

type StripeProduct = {
  id: string;
  name: string;
  description: string;
  active: boolean;
}

type StripePrice = {
  id: string;
  nickname: string;
  active: boolean;
  type: "recurring" | "one_time";
  recurring: {
    interval: string;
    interval_count: number;
    usage_type: string;
  },
  tiers: {
    flat_amount: number;
    unit_amount: number;
    up_to: number;
  }[];
  unit_amount: number|null;
  currency: string;
}

type ProductFormData = {
  productId: string;
  name: string;
  lookupKey: string;
}

type ProductStepProps = {
  integrationId: number;
  onClickNext: () => void;
  onClickCancel: () => void;
  productFormData: ProductFormData;
  setProductFormData: (productFormData: ProductFormData) => void;
  integrations: Integration[];
  setIntegrationId: (integrationId: number) => void;
  hideIntegrationSelect?: boolean;
}

const ProductStep = ({ integrationId, onClickNext, onClickCancel, productFormData, setProductFormData, integrations, setIntegrationId, hideIntegrationSelect = false }: ProductStepProps) => {
  const [products, setProducts] = useState<StripeProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isValid = useMemo(() => {
    return productFormData.productId && productFormData.name && productFormData.lookupKey;
  }, [productFormData]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`/integrations/${integrationId}/products`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [integrationId]);

  const handleProductChange = (value: string | string[]) => {
    const productId = typeof value === 'string' ? value : value[0] || '';
    const product = products.find(p => p.id === productId);
    setProductFormData({
      productId: productId,
      name: product?.name || '',
      lookupKey: productId
    });
  };

  // Transform products to the format expected by Combobox
  const comboboxItems = products.map(product => ({
    value: product.id,
    label: product.name,
    description: product.description
  }));

  return (
    <>
      <DialogHeader>
        <DialogTitle>Select an existing product</DialogTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">Sell one your products you have already created in Stripe</p>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No products found
          </div>
        ) : (
          <div className="space-y-5">
            {!hideIntegrationSelect && (
              <div className="grid gap-2">
                <Label>Integration</Label>
                <Select
                  value={integrationId?.toString()}
                onValueChange={(value) => setIntegrationId(parseInt(value))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an integration" />
                </SelectTrigger>
                <SelectContent>
                  {integrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id.toString()}>
                      {integration.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            )}
            <div className="grid gap-2">
              <Label>Product Name</Label>
              <Combobox
                className="mt-1"
                items={comboboxItems}
                placeholder="Select a product"
                selected={productFormData.productId}
                onSelect={handleProductChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Select Product</Label>
              <Input
                id="name"
                autoComplete="off"
                value={productFormData.name}
                onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                placeholder="e.g., Standard Subscription"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="lookup_key">Lookup Key</Label>
              <Input
                id="lookup_key"
                autoComplete="off"
                value={productFormData.lookupKey}
                onChange={(e) => setProductFormData({ ...productFormData, lookupKey: e.target.value })}
                placeholder="e.g., standard_sub_monthly (unique)"
                required
              />
              <p className="text-sm text-muted-foreground">A unique identifier for this product within your organization. Will update automatically based on name.</p>
            </div>
            <div className="flex justify-between gap-2 mt-4">
                <Button variant="outline" onClick={onClickCancel}>
                  Cancel
                </Button>
                <Button disabled={!isValid} onClick={() => onClickNext()}>
                  Next
                </Button>
              </div>
          </div>
        )}
      </div>
    </>
  );
};

type PriceStepProps = {
  integrationId: number;
  onClickSave: () => void;
  onClickBack: () => void;
  selectedPrices: string[];
  setSelectedPrices: (selectedPrices: string[]) => void;
  productId: string;
}

export const PriceStep = ({ integrationId, onClickSave, onClickBack, selectedPrices, setSelectedPrices, productId }: PriceStepProps) => {
  const [prices, setPrices] = useState<StripePrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isValid = useMemo(() => {
    return selectedPrices.length > 0;
  }, [selectedPrices]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(`/integrations/${integrationId}/products/${productId}/prices`);
        const data = await response.json();
        setPrices(data);
      } catch (error) {
        console.error('Error fetching prices:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const handleProductChange = (value: string | string[]) => {
    const ids = typeof value === 'string' ? [value] : value;
    setSelectedPrices(ids);
  };

  // Transform products to the format expected by Combobox
  const comboboxItems = prices.map(price => ({
    value: price.id,
    label: price.nickname || price.id,
  }));

  const getAmount = (price: StripePrice) => {
    if (price.unit_amount) {
      return formatMoney(price.unit_amount, price.currency);
    }
    return formatMoney(price.tiers[0].flat_amount || price.tiers[0].unit_amount, price.currency);
  }

  const handleRemovePrice = (priceId: string) => {
    setSelectedPrices(selectedPrices.filter(id => id !== priceId));
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Select prices</DialogTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">Which prices associated with this product do you wish to display</p>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : prices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No prices found
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid gap-2">
              <Label>Select prices - Add as many as you like</Label>
              <Combobox
                className="mt-1 w-full"
                items={comboboxItems}
                placeholder="Select a product"
                selected={selectedPrices}
                onSelect={handleProductChange}
                required
                multiple
              />
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto max-h-[200px]">
            {selectedPrices.map((priceId) => {
              const price = prices.find((p) => p.id === priceId);
              return (
                <div key={priceId} className="flex justify-between bg-[#191D3A] rounded-md p-2 px-4 text-white text-sm">
                  <div className="flex items-center gap-2">
                    <CircleCheck className="w-5 h-5" />
                    <h3>{price?.nickname || priceId}</h3>
                    <p className="text-xs">-</p>
                    <p>{getAmount(price!)}</p>
                  </div>
                  <Trash2 className="w-5 h-5 hover:text-red-500 cursor-pointer" onClick={() => handleRemovePrice(priceId)}/>
                </div>
              );
            })}
            </div>

            <div className="flex justify-between gap-2 mt-4">
                <Button variant="outline" onClick={onClickBack}>
                  Go Back
                </Button>
                <Button disabled={!isValid} onClick={() => onClickSave()}>
                  Next
                </Button>
              </div>
          </div>
        )}
      </div>
    </>
  );
};

export default function AddExistingStripeProductDialog({
  onOpenChange,
  open = false,
  integrationId: defaultIntegrationId,
  integrations,
}: AddExistingStripeProductDialogProps) {
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
  };

  const [step, setStep] = useState<'product' | 'price'>('product');
  const [productFormData, setProductFormData] = useState<ProductFormData>({
    productId: '',
    name: '',
    lookupKey: ''
  });
  const [selectedPrices, setSelectedPrices] = useState<string[]>([]);
  const [integrationId, setIntegrationId] = useState<number | undefined>(defaultIntegrationId || integrations[0]?.id);

  const handleSave = () => {
    const body = {
      integration_id: integrationId,
      gateway_product_id: productFormData.productId,
      gateway_prices: selectedPrices,
      name: productFormData.name,
      lookup_key: productFormData.lookupKey
    }

    const productName = productFormData.name || 'new product';
    const toastId = toast.loading(`Creating ${productName}...`);

    router.post(route("products.store"), body, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`Product ${productName} created successfully`, { id: toastId });
        handleOpenChange(false);
      },
      onError: (errors) => {
        toast.error(`Failed to create product: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {step === 'product' && (
          <ProductStep
            integrationId={integrationId!}
            productFormData={productFormData}
            setProductFormData={setProductFormData}
            onClickNext={() => setStep('price')}
            onClickCancel={() => handleOpenChange(false)}
            integrations={integrations}
            setIntegrationId={setIntegrationId}
            hideIntegrationSelect={defaultIntegrationId !== undefined}
          />
        )}
        {step === 'price' && productFormData.productId && (<PriceStep
          integrationId={integrationId!}
          productId={productFormData.productId}
          selectedPrices={selectedPrices}
          setSelectedPrices={setSelectedPrices}
          onClickSave={handleSave}
          onClickBack={() => setStep('product')}
        />)}
      </DialogContent>
    </Dialog>
  );
}
