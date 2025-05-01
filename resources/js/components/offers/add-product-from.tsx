import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { type Price, type Product } from "@/types/offer";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatMoney } from "@/lib/utils";
import { router } from '@inertiajs/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: any;
    offerId: number;
    products: Product[];
}

interface SlotFormData {
    [key: string]: any;
    name: string;
    key: string;
    sort_order: number;
    is_required: boolean;
    default_price_id: number | null;
}

interface ExtendedPrice extends Price {
    pricing_model?: string;
}

export default function AddProductForm({
    open,
    onOpenChange,
    initialData,
    offerId,
    products,
}: Props) {
    console.log('initialData', initialData);
    const isEditing = !!initialData?.id;
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<string>("details");

    const { data, setData, post, put, processing, errors, reset } = useForm<SlotFormData>({
        name: initialData?.name || "",
        key: initialData?.key || "",
        sort_order: initialData?.sort_order || 0,
        is_required: initialData?.is_required ?? true,
        default_price_id: initialData?.default_price?.id || initialData?.default_price_id || null,
    });

    const filteredProducts = products.filter(product => {
        if (!searchTerm) return true;
        const lowerSearchTerm = searchTerm.toLowerCase();
        return (
            product.name.toLowerCase().includes(lowerSearchTerm) ||
            product.prices?.some(price => {
                const amountString = (price.amount / 100).toFixed(2);
                return amountString.includes(lowerSearchTerm);
            })
        );
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const slotName = data.name || 'this slot';
        const toastId = toast.loading(isEditing ? `Updating ${slotName}...` : `Creating ${slotName}...`);

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Slot ${slotName} ${isEditing ? 'updated' : 'created'} successfully`, { id: toastId });
                onOpenChange(false);
            },
            onError: (errors: any) => {
                toast.error(`Failed to ${isEditing ? 'update' : 'create'} slot: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
            },
        };

        if (isEditing) {
            put(route('offers.slots.update', { offer: offerId, slot: initialData.id }), options);
        } else {
            post(route('offers.slots.store', { offer: offerId }), options);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{initialData?.id ? 'Edit' : 'Add'} Checkout Slot</DialogTitle>
                    <DialogDescription>
                        {initialData?.id
                            ? 'Update the slot details and pricing.'
                            : 'Create a new slot for your checkout template.'}
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                    </TabsList>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        <TabsContent value="details" className="space-y-4">
                            <div className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        autoComplete="off"
                                        value={data.name}
                                        onChange={e => setData('name', e.target.value)}
                                        placeholder="e.g., Primary License"
                                    />
                                    {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="key">Key</Label>
                                    <Input
                                        id="key"
                                        autoComplete="off"
                                        value={data.key}
                                        onChange={e => setData('key', e.target.value)}
                                        placeholder="e.g., primary_license"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        A unique identifier for this slot in your checkout template
                                    </p>
                                    {errors.key && <p className="text-sm text-red-500">{errors.key}</p>}
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="sort_order">Sort Order</Label>
                                    <Input
                                        id="sort_order"
                                        type="number"
                                        value={data.sort_order}
                                        onChange={e => setData('sort_order', parseInt(e.target.value))}
                                    />
                                    {errors.sort_order && <p className="text-sm text-red-500">{errors.sort_order}</p>}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="is_required"
                                        checked={data.is_required}
                                        onCheckedChange={(checked) => setData('is_required', !!checked)}
                                    />
                                    <Label htmlFor="is_required">Required in checkout</Label>
                                </div>
                            </div>
                        </TabsContent>

                        <TabsContent value="pricing" className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle>Select Price</CardTitle>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Choose a price for this slot from your products.</p>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Input
                                        placeholder="Search prices..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    <ScrollArea className="h-64 w-full rounded-md border">
                                        <div className="p-4 space-y-4">
                                            {filteredProducts.map(product => (
                                                <div key={product.id} className="p-3 border rounded-md bg-muted/20">
                                                    <h4 className="font-semibold text-base mb-2">{product.name}</h4>
                                                    <div className="pl-4 space-y-2">
                                                        {product.prices?.map(price => {
                                                            const extendedPrice = price as ExtendedPrice;
                                                            return (
                                                                <div key={price.id} className="flex items-center space-x-3 py-1">
                                                                    <input
                                                                        type="radio"
                                                                        id={`price-${price.id}`}
                                                                        name="default_price_id"
                                                                        value={price.id}
                                                                        checked={data.default_price_id === price.id}
                                                                        onChange={() => setData('default_price_id', price.id)}
                                                                        className="h-4 w-4"
                                                                    />
                                                                    <label
                                                                        htmlFor={`price-${price.id}`}
                                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer"
                                                                    >
                                                                        {formatMoney(price.amount, price.currency)}
                                                                        <span className="text-xs text-muted-foreground ml-2">({extendedPrice.pricing_model || 'one_time'})</span>
                                                                    </label>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                    {errors.default_price_id && <p className="text-sm text-red-500">{errors.default_price_id}</p>}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="relative">
                                <span className={`${processing ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                                    {initialData?.id ? 'Update' : 'Create'} Slot
                                </span>
                                {processing && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
