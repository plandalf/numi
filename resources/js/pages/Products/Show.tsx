import { Head, router, usePage } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";
import { Product, type Price } from '@/types/offer';
import { Product as ProductType } from '@/types/product';
import { type BreadcrumbItem } from '@/types';
import { type PageProps as InertiaPageProps } from '@inertiajs/core';

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Plus, Edit, Trash2, ChevronDown } from "lucide-react";
import PriceForm from "@/components/prices/PriceForm";
import { toast } from "sonner";
import { Integration } from "@/types/integration";
import AddExistingStripePriceDialog from "@/components/Products/AddExistingStripePriceDialog";
import PriceTable from '@/components/prices/PriceTable';
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ProductForm from "@/components/Products/ProductForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductShowPageProps extends InertiaPageProps {
  product: Product;
  prices: Price[];
  listPrices: Price[];
  integrations: Integration[];
  filters?: { at?: string; currency?: string; interval?: 'month'|'year'|null };
  children?: Product[];
  parentCandidates?: Array<{ id: number; name: string; lookup_key: string }>
}

export default function Show() {
  const { product, prices, listPrices, filters, children, parentCandidates } = usePage<ProductShowPageProps>().props;

  const [isPriceFormOpen, setIsPriceFormOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState<Price | undefined>(undefined);
  const [newPriceScope, setNewPriceScope] = useState<'list' | 'custom' | 'variant'>('list');
  const [parentPriceForChild, setParentPriceForChild] = useState<Price | undefined>(undefined);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [priceToDelete, setPriceToDelete] = useState<Price | undefined>(undefined);

  const [isAddExistingStripePriceDialogOpen, setIsAddExistingStripePriceDialogOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month'|'year'>(filters?.interval || 'month');
  const [pricingCurrency, setPricingCurrency] = useState<string>(filters?.currency || (product as any).currency || 'usd');
  const [effectiveAt, setEffectiveAt] = useState<string>(filters?.at || '');

  const availableIntervals = Array.from(new Set((prices || []).map(p => p.renew_interval).filter(Boolean))) as Array<'month'|'year'|'week'|'day'>;
  const availableCurrencies = Array.from(new Set((prices || []).map(p => p.currency?.toLowerCase?.()).filter(Boolean) as string[]));

  const openPriceForm = (price?: Price, scope: 'list' | 'custom' | 'variant' = 'list') => {
    // If creating a new price (no price parameter), clear editing state
    if (!price) {
      setEditingPrice(undefined);
      setNewPriceScope(scope);
      setParentPriceForChild(undefined); // Clear parent when using regular form
    } else {
      // If editing existing price, set it
      setEditingPrice(price);
      setNewPriceScope(price.scope); // Use the price's existing scope
      setParentPriceForChild(undefined); // Clear parent when editing
    }

    /** Always open PriceForm for direct price creation */
    setIsPriceFormOpen(true);
  }

  const canCreateCustomOrVariant = listPrices && listPrices.length > 0;

  const handleDeletePrice = () => {
    if (!priceToDelete) return;

    const toastId = toast.loading('Deleting price...');

    router.delete(route('products.prices.destroy', { product: product.id, price: priceToDelete.id }), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Price deleted successfully.', { id: toastId });
        setPriceToDelete(undefined);
      },
      onError: (error) => {
        const errorMsg = Object.values(error).flat().join(", ");
        toast.error(`Failed to delete price: ${errorMsg || 'Unknown error'}`, { id: toastId });
      }
    });
  };

  const handleDeleteProduct = () => {
    const toastId = toast.loading('Deleting product...');

    router.delete(route('products.destroy', product.id), {
      onSuccess: () => {
        toast.success('Product deleted successfully', { id: toastId });
        router.visit(route('products.index'));
      },
      onError: (error) => {
        const errorMsg = Object.values(error).flat().join(", ");
        toast.error(`Failed to delete product: ${errorMsg || 'Unknown error'}`, { id: toastId });
      }
    });
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Products', href: route('products.index') },
    { title: product.name, href: route('products.show', product.id) }
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={product.name} />

              <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
          {/* Product Header */}
        <div className="mb-8 flex justify-between text-sm">
          <div className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label className="font-medium">Product name</Label>

              <p className="break-all">
                {product.name}
              </p>
            </div>
            <div className="grid gap-2">
              <Label className="font-medium">Lookup key</Label>

              <p className="break-all">
                {product.lookup_key}
              </p>
            </div>
            <div className="grid gap-2">
              <Label className="font-medium">State</Label>
              <div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100">{(product as any).current_state || (product as any).status}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="grid gap-2">
              <Label className="font-medium">Product image</Label>
              <p className="text-xs text-muted-foreground">This will show on checkouts if you choose to use an image.</p>
            </div>
            {product.image ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-24 h-24 rounded-md cursor-pointer"
                  />
                </TooltipTrigger>
                <TooltipContent side="right" className="p-0 bg-transparent border-0">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-w-[300px] max-h-[300px] rounded-md shadow-lg"
                  />
                </TooltipContent>
              </Tooltip>
            ) : (
              <div className="w-24 h-24 rounded-md bg-gray-200" />
            )}
          </div>
          <div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsProductFormOpen(true)}>
                <Edit className="w-4 h-4 mr-2" /> Edit product
              </Button>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete product
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Interval:</span>
            {(['month','year','week','day'] as const).filter(i => availableIntervals.includes(i)).map(i => (
              <Button key={i} variant={billingInterval===i ? 'default' : 'outline'} size="sm" onClick={() => setBillingInterval(i as any)}>
                {i[0].toUpperCase()+i.slice(1)}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Currency:</span>
            <div className="flex flex-wrap gap-2">
              {availableCurrencies.map(c => (
                <Button key={c} variant={pricingCurrency===c ? 'default' : 'outline'} size="sm" onClick={() => setPricingCurrency(c)}>
                  {c.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Effective:</span>
            <input className="border rounded-md h-8 px-2 text-sm" type="datetime-local" value={effectiveAt} onChange={(e)=> setEffectiveAt(e.target.value)} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium">Pricing</h2>
              <p className="text-sm text-muted-foreground">Shows all prices for this product.</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Price
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openPriceForm(undefined, 'list')}>
                  <div className="flex flex-col">
                    <span className="font-medium">List Price</span>
                    <span className="text-xs text-muted-foreground">Default publicly listed price</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => openPriceForm(undefined, 'custom')}
                  disabled={!canCreateCustomOrVariant}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Custom Price</span>
                    <span className="text-xs text-muted-foreground">
                      {canCreateCustomOrVariant ? 'One-off price for specific customers' : 'Requires list price first'}
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => openPriceForm(undefined, 'variant')}
                  disabled={!canCreateCustomOrVariant}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">Variant Price</span>
                    <span className="text-xs text-muted-foreground">
                      {canCreateCustomOrVariant ? 'Variant of a list price' : 'Requires list price first'}
                    </span>
                  </div>
                </DropdownMenuItem>
                {product.integration_id && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsAddExistingStripePriceDialogOpen(true)}>
                      <div className="flex flex-col">
                        <span className="font-medium">Import from Stripe</span>
                        <span className="text-xs text-muted-foreground">Add existing Stripe prices</span>
                      </div>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <PriceTable
            prices={prices.filter(p => {
              const matchesInterval = (p.renew_interval ? p.renew_interval === billingInterval : billingInterval === 'month');
              const matchesCurrency = p.currency?.toLowerCase?.() === pricingCurrency.toLowerCase();
              const matchesAt = (() => {
                if (!effectiveAt) return true;
                const from = (p as any).activated_at ? new Date((p as any).activated_at) : null;
                const until = (p as any).deactivated_at ? new Date((p as any).deactivated_at) : null;
                const at = new Date(effectiveAt);
                return (!from || from <= at) && (!until || until > at);
              })();
              return matchesInterval && matchesCurrency && matchesAt;
            })}
            onEdit={openPriceForm}
            onDelete={(price) => setPriceToDelete(price)}
            onCreateChild={(parentPrice, scope) => {
              setEditingPrice(undefined);
              setNewPriceScope(scope);
              setParentPriceForChild(parentPrice);
              setIsPriceFormOpen(true);
            }}
            showActions
          />

          {/* Children / Lineage */}
          {children && children.length > 0 && (
            <div className="mt-8">
              <div className="text-sm font-medium mb-2">Versions</div>
              <div className="flex flex-wrap gap-2 text-sm">
                {children.map((c) => (
                  <a key={c.id} href={route('products.show', c.id)} className="px-2 py-1 rounded-md border hover:bg-gray-50">
                    {(c as any).current_state || 'unknown'} · {c.name}
                  </a>
                ))}
                <Button variant="outline" size="sm" onClick={() => router.post(route('products.version', product.id))}>New Version</Button>
              </div>
            </div>
          )}
        </div>

        {/* Price Form Dialog */}
        <PriceForm
          key={editingPrice ? `edit-${editingPrice.id}` : `create-${newPriceScope}-${parentPriceForChild?.id || 'none'}`}
          open={isPriceFormOpen}
          onOpenChange={(open) => {
            setIsPriceFormOpen(open);
            if (!open) {
              // Clear editing state when dialog closes
              setEditingPrice(undefined);
              setNewPriceScope('list');
              setParentPriceForChild(undefined);
            }
          }}
          product={product}
          initialData={editingPrice || (parentPriceForChild ? {
            scope: newPriceScope,
            parent_list_price_id: parentPriceForChild.id,
            type: parentPriceForChild.type
          } : { scope: newPriceScope })}
          listPrices={listPrices || []}
        />

        {/* Delete Price Dialog */}
        <AlertDialog open={!!priceToDelete} onOpenChange={(open) => !open && setPriceToDelete(undefined)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this price?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the price
                {priceToDelete?.gateway_price_id && ' from both Plandalf and Stripe'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePrice}
                className="bg-red-600 focus:ring-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AddExistingStripePriceDialog
          open={isAddExistingStripePriceDialogOpen}
          onOpenChange={setIsAddExistingStripePriceDialogOpen}
          product={product as ProductType}
        />

        {/* Product Form Dialog */}
        <ProductForm
          open={isProductFormOpen}
          onOpenChange={setIsProductFormOpen}
          initialData={product}
          parentCandidates={parentCandidates || []}
          // Expose parent candidates to the form through window pageProps so Combobox can read them
          // This relies on the page being re-rendered with props. If needed, lift into context/store.
        />

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this product?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the product
                {prices.length > 0 && ' and all associated prices'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProduct}
                className="bg-red-600 focus:ring-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
