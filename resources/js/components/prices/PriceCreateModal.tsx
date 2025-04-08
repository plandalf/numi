import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react'; // Or use fetch like in ProductCreateModal
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { type Price } from '@/types/offer';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: (newPrice: Price) => void;
    productId: number; // ID of the product to associate the price with
    defaultCurrency: string; // Default currency for the new price
}

export default function PriceCreateModal({ open, onOpenChange, onSuccess, productId, defaultCurrency }: Props) {
    // Using Inertia form hook here for simplicity, but adjust if needed
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: 0, // Amount in cents
        currency: defaultCurrency,
        // Send defaults needed by the StoreRequest
        scope: 'list', 
        pricing_model: 'one_time', 
        // Add other fields if the simple endpoint requires them, or rely on backend defaults
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const toastId = toast.loading('Creating price...');

        // Using fetch API for JSON response
        try {
            const response = await fetch(route('products.prices.storeSimple', { product: productId }), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify({...data, amount: data.amount}), // Send amount in cents
            });

            const responseData = await response.json();

            if (!response.ok) {
                let errorMessage = `Failed to create price: ${responseData.message || response.statusText}`;
                if (responseData.errors) {
                    errorMessage = `Failed to create price: ${Object.values(responseData.errors).flat().join(', ')}`;
                }
                throw new Error(errorMessage);
            }

            toast.success(`Price created successfully!`, { id: toastId });
            onSuccess(responseData as Price); // Pass back the new price data
            reset();
            onOpenChange(false);

        } catch (error: any) {
            console.error("Price creation error:", error);
            toast.error(error.message || 'An unexpected error occurred.', { id: toastId });
            // Handle form errors if needed
        }
    };

    // Reset form when modal closes or product ID changes
    useEffect(() => {
        if (!open) {
            reset();
        } else {
            // Ensure currency is updated if default changes while modal is open (unlikely but safe)
            setData('currency', defaultCurrency);
        }
    }, [open, reset, productId, defaultCurrency, setData]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Price</DialogTitle>
                    <DialogDescription>
                        Create a simple, one-time price for this product.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="price-amount">Amount (in cents)</Label>
                        <Input
                            id="price-amount"
                            type="number"
                            value={data.amount}
                            onChange={(e) => setData('amount', parseInt(e.target.value) || 0)}
                            required
                            min="0"
                            disabled={processing}
                        />
                         <p className="text-xs text-muted-foreground">Enter amount in cents (e.g., 1000 for $10.00).</p>
                        {/* Display errors if using Inertia form hook and backend returns them */}
                        {/* {errors.amount && <p className="text-sm text-red-500 mt-1">{errors.amount}</p>} */}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="price-currency">Currency</Label>
                        <Input
                            id="price-currency"
                            value={data.currency}
                            onChange={(e) => setData('currency', e.target.value.toUpperCase())}
                            required
                            maxLength={3}
                            disabled={processing} // Maybe disable if currency is fixed
                            className="uppercase"
                        />
                        {/* {errors.currency && <p className="text-sm text-red-500 mt-1">{errors.currency}</p>} */}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={processing} className="relative">
                            <div className={`${processing ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                                Create Price
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