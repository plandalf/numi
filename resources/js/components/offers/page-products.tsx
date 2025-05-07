import { Button } from '@/components/ui/button';
import { Separator } from '../ui/separator';
import { CircleAlert, CircleCheck, CirclePlus, Plus } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { EditProps } from '@/pages/offers/Edit';
import { Price, Product } from '@/types/offer';
import { Kebab } from '../ui/kebab';
import { AddNewProductDialog } from './dialogs/AddNewProductDialog';
import ProductForm from '../Products/ProductForm';
import { useState } from 'react';
import SlotForm from './SlotForm';
import AddProductForm from './add-product-from';

const Products = ({ products }: { products: Product[] }) => {
  return (
    <div>
      <div className="text-sm">Product</div>
      <div className="mt-2 flex flex-col gap-3.5">
        {products.map((product) => (
          <ItemCard key={product.id} name={product.name} />
        ))}
      </div>
    </div>
  )
}

const Prices = ({ prices }: { prices: Price[] }) => {
  return (
    <div>
      <div className="text-sm">Prices</div>
      <div className="mt-2 flex flex-col gap-3.5">
        {prices.map((prices) => (
          <ItemCard key={prices.id} name={prices.name ?? prices.lookup_key ?? prices.id.toString()} />
        ))}
      </div>
    </div>
  )
}

const ItemCard = ({ name }: { name: string }) => {
  return (
    <div className="flex gap-3 border rounded-md px-4 py-2 text-[#5A618B] items-center justify-between">
      <CircleCheck className="h-full mt-0.5" />
      <div className="text-sm">{name}</div>
      <Kebab items={[
        {
          label: 'Edit',
          onClick: () => {
            console.log('edit');
          }
        },
        {
          label: 'Delete',
          onClick: () => {
            console.log('delete');
          }
        }
      ]} />
    </div>
  )
}
export const PageProducts = () => {
  const { products, offer } = usePage<EditProps>().props;
  const selectedPrices = offer.prices ?? [];
  const selectedProducts = selectedPrices?.map((price) => price.product).filter((product) => !!product) ?? [];

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isAddNewProductDialogOpen, setIsAddNewProductDialogOpen] = useState(false);
  const [isSlotFormOpen, setIsSlotFormOpen] = useState(false);

  return (
    <div className="flex flex-col h-full px-4 py-3.5">
      <h1>Default Product</h1>
      <Separator className="my-3.5" />
      <div>
        {products.length > 0 && (
         <>
          <div className="flex flex-col gap-3.5">
            <Products products={selectedProducts} />
            <Prices prices={selectedPrices} />
          </div>
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
        onSellExistingProductClick={() => { setIsSlotFormOpen(true) }}
        onSellNewProductClick={() => { setIsProductFormOpen(true) }} />

      <AddProductForm
                open={isSlotFormOpen}
                onOpenChange={setIsSlotFormOpen}
                offerId={1}
                products={products}
                />
      <ProductForm open={isProductFormOpen} onOpenChange={setIsProductFormOpen} />
    </div>
  );
};

export default PageProducts;