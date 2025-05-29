import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ProductForm from "@/components/Products/ProductForm";
import PriceForm from "@/components/prices/PriceForm";
import { Price, type Product } from "@/types/offer";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPricesSuccess?: (price: Price) => void;
}

export default function AddNewProductWithPriceDialog({
  open,
  onOpenChange,
  onPricesSuccess
}: Props) {
  const [step, setStep] = useState<'product' | 'price'>('product');
  const [newProduct, setNewProduct] = useState<Product | null>(null);

  // Reset state when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('product');
      setNewProduct(null);
    }
    onOpenChange(isOpen);
  };

  // Handle product creation success
  const handleProductSuccess = (product: Product) => {
    setNewProduct(product);
    setStep('price');
  };

  // Handle price creation success
  const handlePriceSuccess = (price: Price) => {
    handleOpenChange(false);
    onPricesSuccess?.(price);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w3xl max-h-[95vh] flex flex-col">
      <DialogHeader>
          <DialogTitle>Add New Product with Price</DialogTitle>
          <DialogDescription>
            {step === 'product'
              ? "First, create your product"
              : "Now, set up pricing for your product"}
          </DialogDescription>
        </DialogHeader>

        {step === 'product' ? (
          <ProductForm
            open={true}
            onOpenChange={handleOpenChange}
            hideDialog={true}
            onSuccess={handleProductSuccess}
            useJsonResponse
          />
        ) : (
          newProduct && (
            <PriceForm
              open={true}
              onOpenChange={handleOpenChange}
              product={newProduct}
              onSuccess={handlePriceSuccess}
              hideDialog={true}
              useJsonResponse
              hideSuccessToast
            />
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
