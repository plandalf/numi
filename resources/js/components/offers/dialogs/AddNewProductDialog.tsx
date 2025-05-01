import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type AddNewProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSellExistingProductClick: () => void;
  onSellNewProductClick: () => void;
}

export const AddNewProductDialog = ({ open, onOpenChange, onSellExistingProductClick, onSellNewProductClick } : AddNewProductDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Are you selling an existing or new product?</DialogTitle>
        </DialogHeader>
        <span className="text-sm text-gray-500">You can sell existing products you have created in Plandalf, or that already exist in your Stripe account. Or you create a new products to sell here.</span>
        <div className="flex justify-between mt-2">
          <Button variant="outline" onClick={onSellNewProductClick}>
            Create a new product
          </Button>

          <Button onClick={onSellExistingProductClick}>Sell an existing product</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}