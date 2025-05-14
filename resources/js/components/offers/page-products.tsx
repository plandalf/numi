import { Button } from '@/components/ui/button';
import { Separator } from '../ui/separator';
import { CircleAlert, CircleCheck, CirclePlus, Plus, PlusIcon } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/edit';
import { OfferItem, OfferProduct, Price, Product } from '@/types/offer';
import { Kebab } from '../ui/kebab';
import { AddNewProductDialog } from './dialogs/AddNewProductDialog';
import ProductForm from '../Products/ProductForm';
import { useState } from 'react';
import SlotForm from './SlotForm';
import AddProductForm from './add-product-from';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';

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

  const handleExistingProductOnClose = () => {
    setAddExistingProductDialogProps({ open: false, tab: 'product' });
    setSelectedOfferItem(undefined);
    setSelectedProduct(null);
  }

  const OfferItems = ({ offerItems }: { offerItems: OfferItem[] }) => {
    const handleEdit = (offerItem: OfferItem) => {
      setSelectedOfferItem(offerItem);
      setAddExistingProductDialogProps({
        open: true,
        tab: 'product'
      });
    }

    const handleDelete = (offerItem: OfferItem) => {
      const toastId = toast.loading(`Deleting product...`);

      router.delete(route("offers.items.destroy", { offer: offer.id, offerItem: offerItem.id }), {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Product deleted successfully`, { id: toastId });
        },
        onError: (errors) => {
          toast.error(`Failed to delete product: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
        },
      });
    }

    const handleToggleRequired = (item: OfferItem, checked: boolean) => {
      const toastId = toast.loading(`Updating product...`);

      router.put(route("offers.items.update", { offer: offer.id, offerItem: item.id }), {
        is_required: checked
      }, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Product updated successfully`, { id: toastId });
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
              <div className="text-sm">{key + 1}. {item.name}</div>
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
              <div className="flex bg-white border rounded-md px-4 py-2 items-center w-full justify-center hover:bg-gray-50 cursor-pointer" onClick={() => handleEdit(item)}>
                <PlusIcon className="w-4 h-4" /> Add another price
              </div>
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

      router.put(route("offers.items.update", { offer: offer.id, offerItem: offerItem.id }), {
        default_price_id: price.id
      }, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(`Product updated successfully`, { id: toastId });
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

  return (
    <div className="flex flex-col h-full px-4 py-3.5">
      <div>
        {offerItems.length > 0 && (
          <>
            <OfferItems offerItems={offerItems} />
            <Separator className="my-3.5" />
          </>

        )}
        <Button
          variant="default"
          className="w-full mt-6 bg-gray-900 text-white hover:bg-gray-800 flex justify-between"
          onClick={() => setIsAddNewProductDialogOpen(true)}
        >
          <span>Add another line item</span>
          <CirclePlus className="w-4 h-4" />
        </Button>
        {offerItems.length === 0 && (
          <div className="flex gap-3 border border-destructive text-destructive rounded-md p-4 mt-3.5">
            <CircleAlert className="w-5 h-5 mt-0.5" />
            <div className="flex gap-1 flex-col">
              <div className="font-medium">
                No products found.
              </div>
              <div className="">
                Add at least one product to sell
              </div>
            </div>
          </div>
        )}
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
        />
      )}
      <ProductForm open={isProductFormOpen} onOpenChange={setIsProductFormOpen} />
    </div>
  );
};

export default PageProducts;