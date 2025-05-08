import { Button } from '@/components/ui/button';
import { Separator } from '../ui/separator';
import { CircleAlert, CircleCheck, CirclePlus, Plus } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/Edit';
import { OfferProduct, Price, Product } from '@/types/offer';
import { Kebab } from '../ui/kebab';
import { AddNewProductDialog } from './dialogs/AddNewProductDialog';
import ProductForm from '../Products/ProductForm';
import { useState } from 'react';
import SlotForm from './SlotForm';
import AddProductForm from './add-product-from';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';

export const PageProducts = () => {
  const { products, offer } = usePage<EditProps>().props;
  const selectedProducts = offer.products ?? [];

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isAddNewProductDialogOpen, setIsAddNewProductDialogOpen] = useState(false);
  const [addExistingProductDialogProps, setAddExistingProductDialogProps] = useState({
    open: false,
    tab: 'product'
  });
  const [selectedProduct, setSelectedProduct] = useState<OfferProduct>();

  const Products = ({ products }: { products: OfferProduct[] }) => {
    const handleEdit = (product: OfferProduct) => {
      setSelectedProduct(product);
      setAddExistingProductDialogProps({
        open: true,
        tab: 'product'
      });
    }

    const handleDelete = (product: OfferProduct) => {
      const toastId = toast.loading(`Deleting product...`);

      router.delete(route("offers.products.destroy", { offer: offer.id, offerProduct: product.store_offer_product_id }), {
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
        {products.map((product) => (
          <div key={product.id}>
            <div>
              <div className="text-sm">Product</div>
              <div className="mt-2 flex flex-col gap-3.5">
                <ItemCard key={product.id} item={product} onEdit={() => handleEdit(product)} onDelete={() => handleDelete(product)} />
              </div>
            </div>
            <Prices prices={product.prices ?? []} product={product} />
          </div>
        ))}
      </div>
    )
  }

  const Prices = ({ prices, product }: { prices: Price[], product: OfferProduct }) => {
    const handleEdit = () => {
      setSelectedProduct(product);
      setAddExistingProductDialogProps({
        open: true,
        tab: 'pricing'
      });
    }

    return (
      <div>
        <div className="text-sm">Prices</div>
        <div className="mt-2 flex flex-col gap-3.5">
          {prices.map((price) => (
            <ItemCard key={price.id} item={price} onEdit={handleEdit} />
          ))}
        </div>
      </div>
    )
  }

  const ItemCard = ({ item, onEdit, onDelete }: { item: Price | Product, onEdit: () => void, onDelete?: () => void }) => {
    const options = [
      {
        label: 'Edit',
        onClick: onEdit
      }
    ]

    if (onDelete) {
      options.push({
        label: 'Delete',
        onClick: onDelete
      })
    }
    return (
      <div className="flex gap-3 border rounded-md px-4 py-2 text-[#5A618B] items-center justify-between">
        <CircleCheck className="h-full mt-0.5" />
        <div className="text-sm">{item.name} ({item.lookup_key})</div>
        <Kebab items={options} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full px-4 py-3.5">
      <h1>Default Product</h1>
      <Separator className="my-3.5" />
      <div>
        {selectedProducts.length > 0 && (
          <>
            <Products products={selectedProducts} />
            <Separator className="my-3.5" />
          </>

        )}
        <Button
          variant="default"
          className="w-full mt-6 bg-gray-900 text-white hover:bg-gray-800 flex justify-between"
          onClick={() => setIsAddNewProductDialogOpen(true)}
        >
          <span>Add a product</span>
          <CirclePlus className="w-4 h-4" />
        </Button>
        {products.length === 0 && (
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
          onOpenChange={() => { setAddExistingProductDialogProps({ open: false, tab: 'product' }); setSelectedProduct(undefined) }}
          offerId={offer.id}
          products={products}
          initialProduct={selectedProduct}
          tab={addExistingProductDialogProps.tab as 'product' | 'pricing'}
        />
      )}
      <ProductForm open={isProductFormOpen} onOpenChange={setIsProductFormOpen} />
    </div>
  );
};

export default PageProducts;