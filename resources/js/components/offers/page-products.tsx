import { Button } from '@/components/ui/button';
import { Separator } from '../ui/separator';
import { CircleAlert, CircleCheck, CirclePlus, Plus } from 'lucide-react';
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
            <div className="flex gap-3 mt-2 rounded-md p-2 text-[#5A618B] items-center justify-between flex-col border bg-[#F7F9FF]">
              <div className="flex bg-white border rounded-md px-4 py-2 text-[#5A618B] items-center justify-between w-full">
                <div>Required</div>
                <Switch />
              </div>
              <Prices prices={item.prices ?? []} offerItem={item} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const Prices = ({ prices, offerItem }: { prices: Price[], offerItem: OfferItem }) => {
    const handleEdit = () => {
      setSelectedOfferItem(offerItem);
      setAddExistingProductDialogProps({
        open: true,
        tab: 'pricing'
      });
    }

    const options = [
      {
        label: 'Edit',
        onClick: handleEdit
      }
    ]

    return (
      <>
        {prices.map((price) => (
          <div className="flex bg-white border rounded-md px-4 py-2 text-[#5A618B] items-center justify-between w-full">
            <div className="text-sm">{price.name}</div>
            {price.id === offerItem.default_price_id && (
              <Badge variant="secondary">Default</Badge>
            )}
            <Kebab items={options} />
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
          onOpenChange={() => { setAddExistingProductDialogProps({ open: false, tab: 'product' }); setSelectedOfferItem(undefined) }}
          offerId={offer.id}
          products={products}
          initialData={selectedOfferItem}
          tab={addExistingProductDialogProps.tab as 'product' | 'pricing'}
          offerItemsCount={offerItems.length}
        />
      )}
      <ProductForm open={isProductFormOpen} onOpenChange={setIsProductFormOpen} />
    </div>
  );
};

export default PageProducts;