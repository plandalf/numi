import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react'; // Use Inertia form for consistency?
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { type Product } from '@/types/offer';
import axios from '@/lib/axios'; // Assuming Product type is here

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (newProduct: Product) => void;
}

export default function ProductCreateModal({ open, onOpenChange, onSuccess }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        lookup_key: '',
        // Add other optional fields if needed, e.g., gateway_provider
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('Creating product...');

        // Using fetch API for JSON response handling
      try {
        const response = await axios.post(
          route('products.store'),
          data, // Axios handles JSON.stringify internally
          {
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          }
        );

        const responseData = response.data;

        toast.success(`Product "${responseData.name}" created successfully!`, { id: toastId });
        onSuccess(responseData as Product);
        reset();
        onOpenChange(false);

      } catch (error: any) {
        const responseData = error.response?.data;
        let errorMessage = `Failed to create product: ${responseData?.message || error.message}`;

        if (responseData?.errors) {
          errorMessage = `Failed to create product: ${Object.values(responseData.errors).flat().join(', ')}`;
        }

        console.error("Product creation error:", error);
        toast.error(errorMessage, { id: toastId });

        // Optionally set form errors:
        // if (responseData?.errors) {
        //   setErrors(responseData.errors);
        // }
      }

    };

    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            reset();
        }
    }, [open, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Product</DialogTitle>
                    <DialogDescription>
                        Provide the details for the new product.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="product-name">Product Name</Label>
                        <Input
                            id="product-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            disabled={processing}
                        />
                        {/* Display Inertia-style errors if using Inertia form hook */}
                        {/* {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>} */}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="product-lookup-key">Lookup Key</Label>
                        <Input
                            id="product-lookup-key"
                            value={data.lookup_key}
                            onChange={(e) => setData('lookup_key', e.target.value)}
                            required
                            disabled={processing}
                        />
                        {/* {errors.lookup_key && <p className="text-sm text-red-500 mt-1">{errors.lookup_key}</p>} */}
                         <p className="text-xs text-muted-foreground">Unique identifier (e.g., SKU, internal ID).</p>
                    </div>
                    {/* Add other fields here if needed */}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="relative">
                             <div className={`${processing ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                                Create Product
                            </div>
                            {processing && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
