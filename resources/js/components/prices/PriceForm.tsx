import { useForm, usePage } from "@inertiajs/react";
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
    SelectGroup
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea"; // If needed for properties JSON
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatMoney, slugify } from "@/lib/utils"; // Import slugify
import { type Price, type Product } from '@/types/offer'; // Assuming types are centralized

// Placeholder Types if not globally defined
type User = { id: number; name: string; email: string; /* ... other user fields */ };
interface PageProps {
    auth: {
        user: User;
    };
    errors?: Record<string, string>;
    flash?: { success?: string; error?: string };
    config?: { cashier_currency?: string };
    // Add index signature for compatibility with usePage
    [key: string]: unknown;
}

type PriceType = 'one_time' | 'recurring' | 'tiered' | 'volume' | 'graduated' | 'package';
type RecurringInterval = 'day' | 'week' | 'month' | 'year';
type PriceScope = 'list' | 'custom';

// Tier structure similar to VariantForm
interface TierConfig {
    from: number;
    to: number | null;
    unit_amount: number;
    flat_amount?: number | null; // For graduated
}
// Package structure similar to VariantForm
interface PackageConfig {
    size: number;
    unit_amount: number;
}

interface PriceFormData {
    [key: string]: any; // Add index signature
    name: string | null;
    lookup_key: string | null;
    scope: PriceScope;
    parent_list_price_id: number | null;
    type: PriceType;
    amount: number; // In cents
    currency: string;
    renew_interval: RecurringInterval | null;
    billing_anchor: string | null;
    recurring_interval_count: number | null;
    cancel_after_cycles: number | null;
    properties: Record<string, any> | null;
    is_active: boolean;
    gateway_provider: string | null;
    gateway_price_id: string | null;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product;
    initialData?: Price; // For editing
    listPrices: Price[]; // For custom scope parent selection
    onSuccess?: (newOrUpdatedPrice: Price) => void; // Add optional onSuccess callback
}

export default function PriceForm({ 
    open, 
    onOpenChange, 
    product, 
    initialData, 
    listPrices,
    onSuccess // Destructure the new prop
}: Props) {
    const isEditing = !!initialData;
    const { props: pageProps } = usePage<PageProps>();
    const defaultCurrency = product.currency || pageProps.config?.cashier_currency || 'usd'; // Get default currency
    const [isLookupKeyManuallyEdited, setIsLookupKeyManuallyEdited] = useState(!!initialData?.lookup_key); // Track manual edits

    // --- State for complex properties --- 
    const [tiers, setTiers] = useState<TierConfig[]>(initialData?.properties?.tiers || [{ from: 0, to: null, unit_amount: 0 }]);
    const [packageConfig, setPackageConfig] = useState<PackageConfig>(initialData?.properties?.package || { size: 1, unit_amount: 0 });
    // --- End State --- 

    // Define initial state structure
    const getInitialFormData = (): PriceFormData => ({
        name: initialData?.name || null,
        lookup_key: initialData?.lookup_key || null,
        scope: initialData?.scope || 'list',
        parent_list_price_id: initialData?.parent_list_price_id || null,
        type: initialData?.type || 'one_time',
        amount: initialData?.amount || 0,
        currency: initialData?.currency || defaultCurrency,
        renew_interval: initialData?.renew_interval || null,
        billing_anchor: initialData?.billing_anchor || null,
        recurring_interval_count: initialData?.recurring_interval_count || null,
        cancel_after_cycles: initialData?.cancel_after_cycles || null,
        properties: initialData?.properties || null,
        is_active: initialData?.is_active === undefined ? true : initialData.is_active,
        gateway_provider: initialData?.gateway_provider || null,
        gateway_price_id: initialData?.gateway_price_id || null,
    });

    const { data, setData, post, put, processing, errors, reset } = useForm<PriceFormData>(getInitialFormData());

    // Reset form and properties state when dialog closes or initialData changes
    useEffect(() => {
        if (!open) {
            reset();
            setTiers([{ from: 0, to: null, unit_amount: 0 }]);
            setPackageConfig({ size: 1, unit_amount: 0 });
            setIsLookupKeyManuallyEdited(false);
        } else {
            setData(getInitialFormData()); // Use the helper function
            setTiers(initialData?.properties?.tiers || [{ from: 0, to: null, unit_amount: 0 }]);
            setPackageConfig(initialData?.properties?.package || { size: 1, unit_amount: 0 });
            setIsLookupKeyManuallyEdited(!!initialData?.lookup_key); // Set based on initial data
        }
    }, [open, initialData, reset, defaultCurrency, setData]);

    // Update lookup_key when name changes (if not manually edited)
    useEffect(() => {
        if (!isLookupKeyManuallyEdited && data.name) {
            setData('lookup_key', slugify(data.name));
        }
    }, [data.name, isLookupKeyManuallyEdited, setData]);

    const handleLookupKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsLookupKeyManuallyEdited(true);
        setData('lookup_key', e.target.value);
    };

    const handleLookupKeyBlur = () => {
        if (data.lookup_key) { // Only slugify if there is a value
            setData('lookup_key', slugify(data.lookup_key));
        }
    };

    // Update fields based on type changes
    useEffect(() => {
        if (!['tiered', 'volume', 'graduated', 'package'].includes(data.type)) {
            setData('properties', null);
        }
        if (data.type !== 'recurring') {
            setData('renew_interval', null);
            setData('recurring_interval_count', null);
            setData('billing_anchor', null);
        }
    }, [data.type, setData]);

    // Update parent_list_price_id based on scope
     useEffect(() => {
        if (data.scope === 'list') {
            setData('parent_list_price_id', null);
        }
    }, [data.scope, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const preparedData: PriceFormData = { ...data }; 

        if (['tiered', 'volume', 'graduated'].includes(data.type)) {
            preparedData.properties = { tiers };
        } else if (data.type === 'package') {
            preparedData.properties = { package: packageConfig };
        } else {
            preparedData.properties = null; 
        }

        if (data.type !== 'recurring') {
            preparedData.renew_interval = null;
            preparedData.recurring_interval_count = null;
            preparedData.billing_anchor = null;
        }
        preparedData.amount = Math.round(data.amount);
        // Ensure lookup_key is null if empty string
        preparedData.lookup_key = preparedData.lookup_key?.trim() || null;

        const priceDesc = data.name || (isEditing ? `price ${initialData?.id}` : 'new price');
        const toastId = toast.loading(isEditing ? `Updating ${priceDesc}...` : `Creating ${priceDesc}...`);
        
        const commonOptions = {
            preserveScroll: true,
            onFinish: () => { /* Optional */ },
        };

        const handleSuccess = (responseData: any) => {
            toast.success(`Price ${isEditing ? 'updated' : 'created'} successfully`, { id: toastId });
            if (onSuccess) {
                onSuccess(responseData as Price); 
            }
            onOpenChange(false); 
        };

        const handleError = (errorsPayload: any) => {
            let errorMessage = `Failed to ${isEditing ? 'update' : 'create'} price.`;
            if (typeof errorsPayload === 'object' && errorsPayload !== null) {
                const messages = Object.values(errorsPayload).flat().join(", ");
                if (messages) errorMessage = `Failed to ${isEditing ? 'update' : 'create'} price: ${messages}`;
            }
            toast.error(errorMessage, { id: toastId });
        };

        if (onSuccess) {
            // JSON API submission
            const url = isEditing 
                ? route('products.prices.update', { product: product.id, price: initialData!.id })
                : route('products.prices.store', { product: product.id });
            const method = isEditing ? 'PUT' : 'POST';

            fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
                },
                body: JSON.stringify(preparedData), 
            })
            .then(async response => {
                const responseData = await response.json();
                if (!response.ok) {
                    throw responseData; // Throw the error payload
                }
                return responseData;
            })
            .then(handleSuccess)
            .catch(handleError);
        } else {
            const inertiaOptions = {
                ...commonOptions,
                onSuccess: (page: any) => handleSuccess(page.props.price), // Example: if price is returned
                onError: handleError, 
            };

            // Update the form state with the prepared data *before* submitting
            setData(preparedData);

            // Call put/post with only route and options
            if (isEditing) {
                put(route('products.prices.update', { product: product.id, price: initialData!.id }), inertiaOptions);
            } else {
                post(route('products.prices.store', { product: product.id }), inertiaOptions);
            }
        }
    };

    // --- Tiered/Package Input Handlers --- 
     const addTier = () => {
        const lastTier = tiers[tiers.length - 1];
        setTiers([
            ...tiers,
            {
                from: lastTier.to || 0,
                to: null,
                unit_amount: 0,
            },
        ]);
    };

    const removeTier = (index: number) => {
        if (tiers.length > 1) {
            setTiers(tiers.filter((_, i) => i !== index));
        }
    };

    const updateTier = (index: number, field: keyof TierConfig, value: number | null) => {
        const newTiers = [...tiers];
        newTiers[index] = { 
            ...newTiers[index], 
            [field]: value 
        };

        if (field === 'to' && value !== null && index < newTiers.length - 1) {
            newTiers[index + 1].from = value;
        }

        setTiers(newTiers);
    };
    // --- End Tiered/Package Handlers --- 

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Edit' : 'Add'} Price</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? `Update the details for this price on ${product.name}.`
                            : `Add a new price for ${product.name}.`}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-6">
                    {/* Name and Lookup Key */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Price Name (Optional)</Label>
                            <Input
                                id="name"
                                value={data.name || ''}
                                onChange={(e) => setData("name", e.target.value)}
                                placeholder="e.g., Monthly Standard"
                                disabled={processing}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lookup_key">Lookup Key (Optional)</Label>
                            <Input
                                id="lookup_key"
                                value={data.lookup_key || ''}
                                onChange={handleLookupKeyChange}
                                onBlur={handleLookupKeyBlur}
                                placeholder="e.g., standard_monthly"
                                disabled={processing}
                            />
                            {errors.lookup_key && <p className="text-sm text-red-500">{errors.lookup_key}</p>}
                             <p className="text-xs text-muted-foreground">
                                Unique key. {!isLookupKeyManuallyEdited && data.name && "Auto-generated from name."}
                            </p>
                        </div>
                    </div>

                    {/* Scope Selection */}
                     <div className="grid gap-2">
                        <Label htmlFor="scope">Price Scope</Label>
                        <Select 
                            value={data.scope}
                            onValueChange={(value: PriceScope) => setData('scope', value)}
                            disabled={isEditing} 
                        >
                            <SelectTrigger id="scope">
                                <SelectValue placeholder="Select scope" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="list">List Price (Standard)</SelectItem>
                                <SelectItem value="custom">Custom Price (Overrides List)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.scope && <p className="text-sm text-red-500">{errors.scope}</p>}
                        <p className="text-xs text-muted-foreground">
                            List prices are standard. Custom prices override a list price (not fully implemented).
                        </p>
                    </div>

                    {/* Parent List Price Selection (for custom scope) */}
                    {data.scope === 'custom' && (
                        <div className="grid gap-2">
                            <Label htmlFor="parent_list_price_id">Parent List Price</Label>
                            <Select 
                                value={data.parent_list_price_id?.toString() || ''} 
                                onValueChange={(value) => setData('parent_list_price_id', value ? Number(value) : null)}
                                disabled={isEditing || !(listPrices && listPrices.length > 0)} 
                            >
                                <SelectTrigger id="parent_list_price_id">
                                    <SelectValue placeholder="Select parent list price..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {(listPrices || []).length > 0 ? (
                                        (listPrices || []).map(price => (
                                            <SelectItem key={price.id} value={price.id.toString()}>
                                                {formatMoney(price.amount, price.currency)} ({price.type}) {price.name ? `- ${price.name}` : ''}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-muted-foreground">
                                            No active list prices available
                                        </div>
                                    )}
                                </SelectContent>
                            </Select>
                            {errors.parent_list_price_id && <p className="text-sm text-red-500">{errors.parent_list_price_id}</p>}
                            <p className="text-xs text-muted-foreground">
                                Select the list price this custom price is based on.
                            </p>
                        </div>
                    )}

                    {/* Pricing Model (Type) Selection */}
                    <div className="grid gap-2">
                        <Label htmlFor="type">Pricing Model</Label>
                        <Select 
                            value={data.type} 
                            onValueChange={(value: PriceType) => setData('type', value)}
                            disabled={isEditing} 
                        >
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Select pricing model" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="one_time">One Time</SelectItem>
                                <SelectItem value="recurring">Recurring</SelectItem>
                                <SelectItem value="package">Package (Unit Based)</SelectItem>
                                <SelectItem value="tiered">Tiered (Usage Based)</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
                    </div>

                    {/* Amount Input */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (in cents)</Label>
                            <Input
                                id="amount"
                                type="number"
                                min="0"
                                step="1" // Ensure integer input
                                value={data.amount}
                                onChange={e => setData('amount', Number(e.target.value))}
                                disabled={processing || ['tiered', 'volume', 'graduated', 'package'].includes(data.type)} 
                            />
                            {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                            <p className="text-xs text-muted-foreground">
                                Base price in cents. Not used for complex models.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="currency">Currency</Label>
                            <Input
                                id="currency"
                                value={data.currency}
                                onChange={e => setData('currency', e.target.value.toLowerCase())}
                                maxLength={3}
                                placeholder="e.g., usd"
                                disabled={processing || isEditing} 
                            />
                            {errors.currency && <p className="text-sm text-red-500">{errors.currency}</p>}
                        </div>
                    </div>

                    {/* Recurring Fields */}
                    {data.type === 'recurring' && (
                         <Card className="bg-muted/40">
                            <CardContent className="pt-6 space-y-4">
                                <p className="text-sm font-medium">Recurring Settings</p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                     <div className="grid gap-2">
                                        <Label htmlFor="renew_interval">Interval</Label>
                                        <Select 
                                            value={data.renew_interval || ''} 
                                            onValueChange={(value: RecurringInterval) => setData('renew_interval', value)}
                                            disabled={processing}
                                        >
                                            <SelectTrigger id="renew_interval">
                                                <SelectValue placeholder="Select interval" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="day">Day</SelectItem>
                                                <SelectItem value="week">Week</SelectItem>
                                                <SelectItem value="month">Month</SelectItem>
                                                <SelectItem value="year">Year</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.renew_interval && <p className="text-sm text-red-500">{errors.renew_interval}</p>}
                                    </div>
                                     <div className="grid gap-2">
                                        <Label htmlFor="recurring_interval_count">Interval Count</Label>
                                        <Input
                                            id="recurring_interval_count"
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={data.recurring_interval_count || ''}
                                            onChange={e => setData('recurring_interval_count', e.target.value ? Number(e.target.value) : null)}
                                            disabled={processing}
                                            placeholder="e.g., 1"
                                        />
                                        {errors.recurring_interval_count && <p className="text-sm text-red-500">{errors.recurring_interval_count}</p>}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="billing_anchor">Billing Anchor (Optional)</Label>
                                        {/* Replace with Select if predefined anchors are known */}
                                        <Input
                                            id="billing_anchor"
                                            value={data.billing_anchor || ''}
                                            onChange={e => setData('billing_anchor', e.target.value || null)}
                                            disabled={processing}
                                            placeholder="e.g., start_of_month"
                                        />
                                        {errors.billing_anchor && <p className="text-sm text-red-500">{errors.billing_anchor}</p>}
                                    </div>
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="cancel_after_cycles">Cancel After Cycles (Optional)</Label>
                                    <Input
                                        id="cancel_after_cycles"
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={data.cancel_after_cycles || ''}
                                        onChange={e => setData('cancel_after_cycles', e.target.value ? Number(e.target.value) : null)}
                                        disabled={processing}
                                        placeholder="e.g., 12 (for 12 cycles)"
                                    />
                                    {errors.cancel_after_cycles && <p className="text-sm text-red-500">{errors.cancel_after_cycles}</p>}
                                    <p className="text-xs text-muted-foreground">
                                        Automatically cancel after this many cycles. Leave blank for indefinite.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tiered Pricing Fields */}
                    {(data.type === "tiered" /* || data.type === "volume" || data.type === "graduated" */) && (
                        <Card className="bg-muted/40">
                            <CardContent className="pt-6">
                                <p className="text-sm font-medium mb-4">Tiered Pricing Configuration</p>
                                <div className="space-y-2">
                                    {tiers.map((tier, index) => (
                                        <div
                                            key={index}
                                            className="flex space-x-2 items-end rounded-md border bg-background p-2"
                                        >
                                            <div className="grid gap-1 flex-1">
                                                <Label className="text-xs">From (Units)</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={tier.from}
                                                    onChange={(e) => updateTier(index, 'from', Number(e.target.value))}
                                                    disabled={index > 0 || processing} 
                                                    className="h-8"
                                                />
                                            </div>

                                            <div className="grid gap-1 flex-1">
                                                <Label className="text-xs">To (Units)</Label>
                                                <Input
                                                    type="number"
                                                    min={tier.from + 1} // Ensure `to` is greater than `from`
                                                    step="1"
                                                    value={tier.to === null ? '' : tier.to}
                                                    onChange={(e) => updateTier(index, 'to', e.target.value ? Number(e.target.value) : null)}
                                                    placeholder="∞" 
                                                    disabled={processing}
                                                    className="h-8"
                                                />
                                            </div>

                                            <div className="grid gap-1 flex-1">
                                                <Label className="text-xs">Unit Amount (¢)</Label>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    value={tier.unit_amount}
                                                    onChange={(e) => updateTier(index, 'unit_amount', Number(e.target.value))}
                                                    disabled={processing}
                                                    className="h-8"
                                                />
                                            </div>

                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeTier(index)}
                                                disabled={tiers.length === 1 || processing}
                                                className="h-8 w-8 mt-6"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addTier}
                                        disabled={processing}
                                        className="w-full"
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Tier
                                    </Button>
                                    {errors.properties && <p className="text-sm text-red-500">{errors.properties}</p>}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Package Pricing Fields */}
                    {data.type === "package" && (
                        <Card className="bg-muted/40">
                            <CardContent className="pt-6 space-y-4">
                                 <p className="text-sm font-medium">Package Pricing Configuration</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="package_size">Package Size (Units)</Label>
                                        <Input
                                            id="package_size"
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={packageConfig.size}
                                            onChange={(e) => setPackageConfig({ ...packageConfig, size: Number(e.target.value) })}
                                            disabled={processing}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="package_price">Package Price (¢)</Label>
                                        <Input
                                            id="package_price"
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={packageConfig.unit_amount}
                                            onChange={(e) => setPackageConfig({ ...packageConfig, unit_amount: Number(e.target.value) })}
                                            disabled={processing}
                                        />
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Charge per package of {packageConfig.size || 1} units.
                                </p>
                                {errors.properties && <p className="text-sm text-red-500">{errors.properties}</p>}
                            </CardContent>
                        </Card>
                    )}

                     {/* Is Active Switch */}
                    <div className="flex items-center space-x-2 pt-2">
                        <Switch 
                            id="is_active" 
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked)}
                            disabled={processing}
                        />
                        <Label htmlFor="is_active">Price Active</Label>
                         {errors.is_active && <p className="text-sm text-red-500 ml-4">{errors.is_active}</p>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Inactive prices cannot be used in new checkouts or subscriptions.
                    </p>

                    {/* Display general properties error if not caught above */}
                    {errors.properties && 
                     !['tiered', 'volume', 'graduated', 'package'].includes(data.type) && (
                        <p className="text-sm text-red-500 pt-2">{errors.properties}</p>
                    )}
                    
                    {/* Submit/Cancel Buttons */} 
                    <div className="flex justify-end space-x-2 pt-4 sticky bottom-0 bg-background py-3 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={processing}
                            className="transition-all duration-200 active:scale-95"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="relative transition-all duration-200 active:scale-95 min-w-[100px]"
                        >
                            <div className={`${processing ? "opacity-0" : "opacity-100"} transition-opacity`}>
                                {isEditing ? "Update" : "Create"} Price
                            </div>
                            {processing && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                </div>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
} 