import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2, CircleCheck } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { OfferItem, OfferItemType, OfferProduct, type Price, type Product } from "@/types/offer";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import { router } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Combobox } from "@/components/combobox";
import PriceForm from "../prices/PriceForm";

/**
 * Generates an ordinal name based on a number
 * @param num - The number to convert to an ordinal name
 * @returns The ordinal name (Primary, Secondary, Third, etc.)
 */
export function generateName(num: number): string {
  const ordinals: Record<number, string> = {
    1: "Primary",
    2: "Secondary",
    3: "Third",
    4: "Fourth",
    5: "Fifth",
    6: "Sixth",
    7: "Seventh",
    8: "Eighth",
    9: "Ninth",
    10: "Tenth",
    11: "Eleventh",
    12: "Twelfth",
    13: "Thirteenth",
    14: "Fourteenth",
    15: "Fifteenth",
    16: "Sixteenth",
    17: "Seventeenth",
    18: "Eighteenth",
    19: "Nineteenth",
    20: "Twentieth"
  };

  // Return the named ordinal if available, otherwise use a numeric format
  return `${ordinals[num] || num.toString()} item`;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: OfferItem;
  offerId: number;
  products: Product[];
  tab?: 'product' | 'pricing';
  offerItemsCount: number;
  selectedProduct?: Product | null;
  type: OfferItemType;
}

interface AddOfferItemFormData {
  [key: string]: any;
  name: string;
  key: string;
  sort_order?: number;
  is_required?: boolean;
  default_price_id?: number | null;
}

export default function AddProductForm({
  open,
  onOpenChange,
  initialData,
  offerId,
  products,
  tab: defaultTab = 'product',
  offerItemsCount,
  selectedProduct: defaultSelectedProduct,
  type
}: Props) {
  const isEditing = !!initialData;
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialData ? products.find(p => p.id === defaultSelectedProduct?.id) || null : null);
  const [addNewPriceDialogOpen, setAddNewPriceDialogOpen] = useState(false);

  useEffect(() => {
    setSelectedProduct(initialData ? products.find(p => p.id === defaultSelectedProduct?.id) || null : null);
  }, [initialData, defaultSelectedProduct, products]);

  // Format products for combobox
  const productOptions = products.map(product => ({
    value: product.id.toString(),
    label: product.name
  }));

  // Handle product selection
  const handleProductSelect = (productId: string) => {
    const product = products.find(p => p.id.toString() === productId);
    setSelectedProduct(product || null);
  };

  const defaultName = generateName(offerItemsCount + 1);
  const defaultKey = defaultName.toLowerCase().replace(/\s+/g, '_');

  const { data, setData, post, put, processing, errors, reset } = useForm<AddOfferItemFormData>({
    name: initialData?.name || defaultName,
    key: initialData?.key || defaultKey,
    is_required: initialData?.is_required || offerItemsCount === 0,
    prices: initialData?.prices?.map(price => price.id.toString()) || [],
    default_price_id: initialData?.default_price_id || null,
    type: type
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const options = {
      preserveScroll: true,
      onSuccess: () => {
        onOpenChange(false);
      },
      onError: (errors: any) => {
        toast.error(`Failed to ${isEditing ? 'update' : 'create'} offer item: ${Object.values(errors).flat().join(", ")}`);
      },
    };

    if (isEditing) {
      put(route('offers.items.update', { offer: offerId, offerItem: initialData.id }), options);
    } else {
      post(route('offers.items.store', { offer: offerId }), options);
    }
  };

  const pricesOptions = useMemo(() => {
    return (selectedProduct?.prices || []).map(price => ({
      value: price.id.toString(),
      label: price.name || `${price.type} - ${formatMoney(price.amount, price.currency)}`
    }));
  }, [selectedProduct]);


  const handlePriceSelect = (priceIds: string[]) => {
    const newPrices = [...data.prices.filter((id: string) => !pricesOptions.flatMap(option => option.value).includes(id)), ...priceIds];
    setData('prices', newPrices);

    if (!data.default_price_id) {
      setData('default_price_id', newPrices[0]);
    }
  };

  const handlePriceSuccess = (price: Price) => {
    router.reload({ only: ['products'] });

    setData('prices', [...data.prices, price.id.toString()]);
    setAddNewPriceDialogOpen(false);
  };

  const handleAddNewPrice = () => {
    setAddNewPriceDialogOpen(true);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Select Product and Prices</DialogTitle>
            <DialogDescription>
              Select at least one product and price to sell
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="product">Product</TabsTrigger>
              <TabsTrigger value="pricing" disabled={!selectedProduct}>Pricing</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <TabsContent value="product" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="product">Select Product</Label>
                    <Combobox
                      items={productOptions}
                      placeholder="Select a product"
                      onSelect={(value) => handleProductSelect(value as string)}
                      selected={selectedProduct?.id?.toString() || ""}
                      modal
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Select Price</Label>
                      <div className="grid gap-2">
                        <Combobox
                          className="mt-1 w-full"
                          items={(selectedProduct?.prices || []).map(price => ({
                            value: price.id.toString(),
                            label: price.name || `${price.type} - ${formatMoney(price.amount, price.currency)}`
                          }))}
                          placeholder="Select prices"
                          selected={data.prices}
                          onSelect={(value) => {
                            const ids = typeof value === 'string' ? [value] : value;
                            handlePriceSelect(ids);
                          }}
                          required
                          multiple
                          modal
                        />
                      </div>
                    </div>

                    {data.prices.length > 0 && (<div className="flex flex-col gap-2 overflow-y-auto max-h-[200px]">
                      <Label>Your selected prices show here</Label>
                      {data.prices.map((priceId: string) => {
                        const price = selectedProduct?.prices?.find((p) => p.id.toString() === priceId);
                        if (!price) return null;

                        return (
                          <div key={priceId} className="flex justify-between bg-[#191D3A] rounded-md p-2 px-4 text-white text-sm">
                            <div className="flex items-center gap-2">
                              <CircleCheck className="w-5 h-5" />
                              <h3>{price.name || `${price.type}`}</h3>
                              <p className="text-xs">-</p>
                              <p>{formatMoney(price.amount, price.currency)}</p>
                            </div>
                            <Trash2
                              className="w-5 h-5 hover:text-red-500 cursor-pointer"
                              onClick={() => setData('prices', data.prices.filter((id: string) => id !== priceId))}
                            />
                          </div>
                        );
                      })}
                    </div>)}

                    <Button type="button" variant="outline" onClick={handleAddNewPrice}>Create new price</Button>
                  </div>
                </div>
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                  Cancel
                </Button>
                {activeTab === 'pricing' && (<Button type="submit" disabled={processing || data.prices.length === 0} className="relative">
                  <span className={`${processing ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                    Save
                  </span>
                  {processing && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  )}
                </Button>)}

                {activeTab === 'product' && (
                  <Button type="button" className="relative" onClick={() => setActiveTab('pricing')} disabled={!selectedProduct}>
                    Next
                  </Button>
                )}
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
      {selectedProduct && addNewPriceDialogOpen && <PriceForm
        open
        onOpenChange={setAddNewPriceDialogOpen}
        product={selectedProduct}
        onSuccess={handlePriceSuccess}
        useJsonResponse
      />}
    </>
  );
}
