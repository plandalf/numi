import { Link } from '@inertiajs/react';
import { Boxes, CircleChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useState } from 'react';
import { Integration } from '@/types/integration';

interface AddNewProductDialogProps {
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  onCreateProductPlandalfClick?: () => void;
  integrations: Integration[];
  onCreateExistingProductClick?: () => void;
}

export default function AddNewProductDialog({
  onOpenChange,
  open = false,
  onCreateProductPlandalfClick,
  integrations,
  onCreateExistingProductClick
}: AddNewProductDialogProps) {

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange?.(newOpen);
  };

  const handleCreateProductPlandalfClick = () => {
    onCreateProductPlandalfClick?.();
    handleOpenChange(false);
  };

  const hasIntegrations = integrations.length > 0;

  const ConnectToStripeButton = () => {
    const handleClick = () => {
      if (hasIntegrations) {
        handleOpenChange(false);
        onCreateExistingProductClick?.();
      }
    }
    return (
      <Card className="flex flex-row items-center justify-between p-4 text-white w-full !bg-[#6772E5] hover:brightness-90 cursor-pointer" onClick={handleClick}>
        <div className='flex gap-4 items-center'>
          <img src="/assets/icons/stripe.svg" alt="Stripe" className="w-10 h-10" />

          <div className='text-start'>
            <p className="text-xl sm:text-xl font-semibold text-white">{hasIntegrations ? 'Import an existing product' : 'Connect to Stripe'}</p>
            <p className="text-sm font-medium text-white">
              Use products from your Stripe account
            </p>
          </div>
          <div>
            <CircleChevronRight className="w-6 h-6 text-white" />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add a new product</DialogTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add a new product to sell
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Card className="flex flex-row items-center justify-between p-4 w-full cursor-pointer hover:bg-gray-100" onClick={handleCreateProductPlandalfClick}>
            <div className='flex gap-4 items-center'>
              <Boxes className="w-12 h-12 stroke-[1]" />
              <div>
                <p className="text-xl sm:text-xl font-semibold">Create a new product</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Make a new product in Plandalf
                </p>
              </div>
              <div>
                <CircleChevronRight className="w-6 h-6" />
              </div>
            </div>
          </Card>
          {!hasIntegrations ? (
            <Link href="/integrations/stripe/authorizations" method="post" as="button" className="w-full cursor-pointer">
              <ConnectToStripeButton />
            </Link>
          ) : (
            <ConnectToStripeButton />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
