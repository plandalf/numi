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
import { useState, useEffect } from "react";
import { OfferProduct, type Price, type Product } from "@/types/offer";
import { toast } from "sonner";
import { formatMoney } from "@/lib/utils";
import { router } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Combobox } from "@/components/combobox";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProduct?: OfferProduct;
  offerId: number;
  products: Product[];
  tab?: 'product' | 'pricing';
}

export default function AddProductForm({
  open,
  onOpenChange,
  initialProduct,
  offerId,
  products,
  tab: defaultTab = 'product'
}: Props) {
  const isEditing = !!initialProduct;
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialProduct ? products.find(p => p.id === initialProduct.id) || null : null);
  const [selectedPrices, setSelectedPrices] = useState<string[]>(initialProduct?.prices?.map(price => price.id.toString()) || []);

  const [processing, setProcessing] = useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    const productName = selectedProduct?.name || 'this product';
    const toastId = toast.loading(isEditing ? `Updating ${productName}...` : `Creating ${productName}...`);

    // Include selected prices in the submission data
    const formData = {
      product_id: selectedProduct?.id,
      prices: selectedPrices,
    };

    if (isEditing) {
      router.put(route('offers.products.update', { offer: offerId, offerProduct: initialProduct?.store_offer_product_id }), formData, {
        onSuccess: () => {
          toast.success(`${productName} updated successfully`, { id: toastId });
          onOpenChange(false);
          setProcessing(false);
        },
        onError: (errors: any) => {
          toast.error(`Failed to update product: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
          setProcessing(false);
        },
      });
    } else {
      router.post(route('offers.products.store', { offer: offerId }), formData, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Product ${productName} created successfully`, { id: toastId });
          onOpenChange(false);
          setProcessing(false);
        },
        onError: (errors: any) => {
          toast.error(`Failed to create product: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
          setProcessing(false);
        },
      });
    }
  };

  return (
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
            <TabsTrigger value="product">Details</TabsTrigger>
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
                <div className="grid gap-2">
                  <Label htmlFor="key">Lookup Key</Label>
                  <Input
                    id="key"
                    autoComplete="off"
                    value={selectedProduct?.lookup_key}
                    placeholder="e.g., primary_license"
                    disabled
                  />
                  <p className="text-sm text-muted-foreground">
                    A unique identifier for this product within your organization. Will update automatically based on name.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="space-y-4">
                {selectedProduct ? (
                  <>
                    <div>
                      <Label>Select Price</Label>
                      <div className="grid gap-2">
                        <Combobox
                          className="mt-1 w-full"
                          items={(selectedProduct.prices || []).map(price => ({
                            value: price.id.toString(),
                            label: price.name || `${price.type} - ${formatMoney(price.amount, price.currency)}`
                          }))}
                          placeholder="Select prices"
                          selected={selectedPrices}
                          onSelect={(value) => {
                            const ids = typeof value === 'string' ? [value] : value;
                            setSelectedPrices(ids);
                          }}
                          required
                          multiple
                          modal
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 overflow-y-auto max-h-[200px]">
                      <Label>Your selected prices show here</Label>
                      {selectedPrices.map((priceId) => {
                        const price = selectedProduct.prices?.find((p) => p.id.toString() === priceId);
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
                              onClick={() => setSelectedPrices(selectedPrices.filter(id => id !== priceId))}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Please select a product first
                  </div>
                )}
              </div>
            </TabsContent>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                Cancel
              </Button>
              {activeTab === 'pricing' && (<Button type="submit" disabled={processing || selectedPrices.length === 0} className="relative">
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
  );
}
