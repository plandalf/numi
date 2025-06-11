import { Button } from '@/components/ui/button';
import { CircleAlert, CirclePlus, PlusIcon, Pencil } from 'lucide-react';
import { useForm, usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';
import { OfferItem, OfferItemType, Price, Product } from '@/types/offer';
import { Kebab } from '../ui/kebab';
import { AddNewProductDialog } from './dialogs/AddNewProductDialog';
import { useMemo, useState } from 'react';
import AddProductForm, { generateName } from './add-product-from';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import AddNewProductWithPriceDialog from './dialogs/AddNewProductWithPriceDialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


const NewProductAndPricesOfferItem = ({ open, setOpen, offerItemsCount, type, offerId }: { offerId: number, offerItemsCount: number, type: OfferItemType, open: boolean, setOpen: (open: boolean) => void }) => {
  const defaultName = generateName(offerItemsCount + 1);
  const defaultKey = defaultName.toLowerCase().replace(/\s+/g, '_');

  const handlePricesSuccess = (price: Price) => {
    const body = {
      name: defaultName,
      key: defaultKey,
      is_required: offerItemsCount === 0,
      prices: [price.id],
      default_price_id: price.id,
      type: type
    }

    router.post(route('offers.items.store', { offer: offerId }), body, {
      preserveScroll: true,
      onSuccess: () => {
        setOpen(false);
      },
      onError: (errors: any) => {
        toast.error(`Failed to create price: ${Object.values(errors).flat().join(", ")}`);
      },
    });
  }

  return (
    <AddNewProductWithPriceDialog
      open={open}
      onOpenChange={setOpen}
      onPricesSuccess={handlePricesSuccess}
    />
  )
}

export const PageProducts = () => {
  const { products, offer } = usePage<EditProps>().props;
  const offerItems = offer.items ?? [];

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isAddNewProductDialogOpen, setIsAddNewProductDialogOpen] = useState(false);
  const [addExistingProductDialogProps, setAddExistingProductDialogProps] = useState({
    open: false,
    tab: 'product'
  });
  const [selectedOfferItem, setSelectedOfferItem] = useState<OfferItem>();
  const [selectedProduct, setSelectedProduct] = useState<Product | null | undefined>(null);
  const [selectedOfferItemType, setSelectedOfferItemType] = useState<OfferItemType>(OfferItemType.STANDARD);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState<string>('');
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameItemId, setRenameItemId] = useState<number | null>(null);

  const handleExistingProductOnClose = () => {
    setAddExistingProductDialogProps({ open: false, tab: 'product' });
    setSelectedOfferItem(undefined);
    setSelectedProduct(null);
    setSelectedOfferItemType(OfferItemType.STANDARD);
  }

  const handleRenameClick = (item: OfferItem) => {
    setRenameValue(item.name);
    setRenameItemId(item.id);
    setIsRenameDialogOpen(true);
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameItemId) return;
    setRenameLoading(true);
    router.put(route('offers.items.update', { offer: offer.id, item: renameItemId }), {
      name: renameValue,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Product name updated');
        setIsRenameDialogOpen(false);
      },
      onError: (e) => {
        toast.error('Failed to update product name');
      },
      onFinish: () => setRenameLoading(false),
    });
  };

  const OfferItems = ({ offerItems }: { offerItems: OfferItem[] }) => {
    const handleEdit = (offerItem: OfferItem) => {
      setSelectedOfferItem(offerItem);
      setAddExistingProductDialogProps({
        open: true,
        tab: 'product'
      });
    }

    const handleDelete = (offerItem: OfferItem) => {
      const toastId = toast.loading(`Deleting offer item...`);

      router.delete(route("offers.items.destroy", { offer: offer.id, item: offerItem.id }), {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Offer item deleted successfully`, { id: toastId });
        },
        onError: (errors) => {
          toast.error(`Failed to delete offer item: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
        },
      });
    }

    const handleToggleRequired = (item: OfferItem, checked: boolean) => {
      const toastId = toast.loading(`Updating product...`);

      router.put(route("offers.items.update", { offer: offer.id, item: item.id }), {
        is_required: checked
      }, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Item updated successfully`, { id: toastId });
        },
        onError: (errors) => {
          toast.error(`Failed to update product: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
        },
      });
    }

    return (
      <div className="flex flex-col gap-3.5">
        {offerItems.map((item, key) => (
          <div key={item.id}>
            <div className="flex justify-between">
              <div className="flex items-center gap-1 text-sm">
                {key + 1}. {item.name}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRenameClick(item)}
                  className="ml-1"
                  tooltip="Rename"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
              <Kebab items={[{
                label: 'Edit',
                onClick: () => handleEdit(item)
              }, {
                label: 'Delete',
                onClick: () => handleDelete(item)
              }]} />
            </div>
            <div className="flex gap-3 mt-2 rounded-md p-2 items-center justify-between flex-col border bg-[#F7F9FF]">
              <div className="flex bg-white border rounded-md px-4 py-2 items-center justify-between w-full">
                <div>Required</div>
                <Switch defaultChecked={item.is_required} onCheckedChange={(checked) => handleToggleRequired(item, checked)} />
              </div>
              <Prices prices={item.prices ?? []} offerItem={item} />
              <Button variant="outline" className="w-full" onClick={() => handleEdit(item)}>
                <PlusIcon className="w-4 h-4" /> Add a price
              </Button>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const Prices = ({ prices, offerItem }: { prices: Price[], offerItem: OfferItem }) => {
    const handleEdit = (price: Price) => {
      setSelectedOfferItem(offerItem);
      setSelectedProduct(price.product);
      setAddExistingProductDialogProps({
        open: true,
        tab: 'pricing'
      });
    }

    const handleMakeDefault = (price: Price) => {
      const toastId = toast.loading(`Updating product...`);

      router.put(route("offers.items.update", { offer: offer.id, item: offerItem.id }), {
        default_price_id: price.id
      }, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Item updated successfully`, { id: toastId });
        },
      });
    }

    return (
      <>
        {prices.map((price) => (
          <div className="flex bg-white border rounded-md px-4 py-2 items-center justify-between w-full">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-bold">{price.product?.name || price.name}</div>
              <div className="text-xs">{price.name} {price.currency.toUpperCase()} ${price.amount / 100}</div>
              {price.lookup_key && <div className="text-xs">{price.lookup_key}</div>}

              {price.id === offerItem.default_price_id && (
                <Badge variant="secondary">Default</Badge>
              )}
            </div>
            <Kebab items={[{
              label: 'Make default',
              onClick: () => handleMakeDefault(price)
            }, {
              label: 'Edit',
              onClick: () => handleEdit(price)
            }]} />
          </div>
        ))}
      </>
    )
  }

  const handleAddPrice = (type: OfferItemType) => {
    setSelectedOfferItemType(type);
    setIsAddNewProductDialogOpen(true);
  }

  const MainProducts = () => {
    return (
      <div className='flex flex-col gap-3.5'>
        <div className="text-sm font-bold">Main Products</div>
        {offerItems.filter((item) => item.type === OfferItemType.STANDARD).length > 0 ? (
          <div className="flex flex-col gap-3.5">
            <OfferItems offerItems={offerItems.filter((item) => item.type === OfferItemType.STANDARD)} />
          </div>

        ) : (
          <div className="flex gap-3 border border-destructive text-destructive rounded-md p-4 mt-3.5">
            <CircleAlert className="w-5 h-5 mt-0.5" />
            <div className="flex gap-1 flex-col">
              <div className="font-medium">
                No line items found.
              </div>
              <div className="">
                You ned to add at least 1 line item
              </div>
            </div>
          </div>
        )}
        <Button
          variant="default"
          className="w-full"
          onClick={() => handleAddPrice(OfferItemType.STANDARD)}
        >
          <span>Add another product</span>
          <CirclePlus className="w-4 h-4" />
        </Button>      </div>
    )
  }

  const AddOns = () => {
    return (
      <div className="flex flex-col gap-3.5">
        <div className="text-sm font-bold">Add-Ons</div>
        {offerItems.filter((item) => item.type === OfferItemType.OPTIONAL).length > 0 && (
          <div className="flex flex-col gap-3.5">
            <OfferItems offerItems={offerItems.filter((item) => item.type === OfferItemType.OPTIONAL)} />
          </div>
        )}
        <Button
          variant="outline"
          className="w-full flex justify-between"
          onClick={() => handleAddPrice(OfferItemType.OPTIONAL)}
        >
          <span>Add an add-on (optional)</span>
          <CirclePlus className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  const validations = useMemo(() => {
    const allPrices = offerItems.flatMap(item => item.prices ?? []);
    const currencies = new Set(allPrices.map(price => price.currency));
    const gatewayProviders = new Set(allPrices.map(price => price.gateway_provider));

    return {
      hasMultipleCurrencies: currencies.size > 1,
      hasMultipleGatewayProviders: gatewayProviders.size > 1,
      currencies: Array.from(currencies),
      gatewayProviders: Array.from(gatewayProviders),
    };
  }, [offerItems]);

  const Warning = () => {
    if (validations.hasMultipleCurrencies || validations.hasMultipleGatewayProviders) {
      return (
        <div className="flex flex-col gap-3 border border-destructive text-destructive rounded-md p-4 mt-3.5">
          <div className="flex items-center gap-2">
            <CircleAlert className="w-5 h-5 mt-0.5" />
            <div className="font-medium">
              Errors
            </div>
          </div>
          <div className="flex gap-1 flex-col">
            <ul className="flex flex-col gap-1 list-disc pl-4">
              {validations.hasMultipleCurrencies && (
                <li>
                  All products must use the same currency. Found currencies: {validations.currencies.join(', ')}
                </li>
              )}
              {validations.hasMultipleGatewayProviders && (
                <li>
                  All products must use the same gateway provider. Found gateway providers: {validations.gatewayProviders.join(', ')}
                </li>
              )}
            </ul>
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="flex flex-col h-full px-4 py-3.5">
      <div>
        <Warning />
        <MainProducts />
        <Separator className="my-3.5 w-full" />
        <AddOns />
      </div>

      <AddNewProductDialog
        open={isAddNewProductDialogOpen}
        onOpenChange={setIsAddNewProductDialogOpen}
        onSellExistingProductClick={() => { setIsAddNewProductDialogOpen(false); setAddExistingProductDialogProps({ open: true, tab: 'product' }) }}
        onSellNewProductClick={() => { setIsAddNewProductDialogOpen(false); setIsProductFormOpen(true) }} />

      {addExistingProductDialogProps.open && (
        <AddProductForm
          open
          onOpenChange={handleExistingProductOnClose}
          offerId={offer.id}
          products={products}
          initialData={selectedOfferItem}
          tab={addExistingProductDialogProps.tab as 'product' | 'pricing'}
          offerItemsCount={offerItems.length}
          selectedProduct={selectedProduct}
          type={selectedOfferItemType}
        />
      )}
      <NewProductAndPricesOfferItem
        open={isProductFormOpen}
        setOpen={setIsProductFormOpen}
        offerId={offer.id}
        offerItemsCount={offerItems.length}
        type={selectedOfferItemType}
      />

      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename product</DialogTitle>
            <DialogDescription>Give this product a new name.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRenameSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rename-product-name">Name</Label>
              <Input
                id="rename-product-name"
                value={renameValue}
                onChange={e => setRenameValue(e.target.value)}
                placeholder="Enter product name"
                autoFocus
                autoComplete="off"
                disabled={renameLoading}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={renameLoading}>
                {renameLoading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PageProducts;