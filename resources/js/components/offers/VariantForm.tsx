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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { type OfferVariant, type TierConfig, type PackageConfig } from "@/types/offer";
import { ImageUpload } from "@/components/ui/image-upload";

type VariantType = "one_time" | "subscription";
type PricingModel = "standard" | "graduated" | "volume" | "package";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<OfferVariant>;
    offerId: number;
    defaultCurrency: string;
}

export default function VariantForm({
    open,
    onOpenChange,
    initialData,
    offerId,
    defaultCurrency,
}: Props) {
    const [tiers, setTiers] = useState<TierConfig[]>(
        initialData?.properties?.tiers || [{ from: 0, to: null, unit_amount: 0 }]
    );
    const [packageConfig, setPackageConfig] = useState<PackageConfig>(
        initialData?.properties?.package || { size: 1, unit_amount: 0 }
    );

    const { data, setData, post, put, processing, errors, reset } = useForm<{
        name: string;
        description: string;
        type: VariantType;
        pricing_model: PricingModel;
        amount: number | null;
        currency: string;
        media_id: number | null;
        properties: Record<string, any> | null;
    }>({
        name: initialData?.name || "",
        description: initialData?.description || "",
        type: (initialData?.type as VariantType) || "one_time",
        pricing_model: (initialData?.pricing_model as PricingModel) || "standard",
        amount: initialData?.pricing_model === "standard" ? (initialData?.amount || 0) : null,
        currency: initialData?.currency || defaultCurrency,
        media_id: initialData?.media_id || null,
        properties: initialData?.pricing_model === "standard" ? null : initialData?.properties || null,
    });

    // Reset form when dialog opens/closes
    useEffect(() => {
        if (!open) {
            reset();
            setTiers([{ from: 0, to: null, unit_amount: 0 }]);
            setPackageConfig({ size: 1, unit_amount: 0 });
        }
    }, [open]);

    // Update pricing model when type changes
    useEffect(() => {
        if (data.type === "one_time" && !["standard", "package"].includes(data.pricing_model)) {
            setData("pricing_model", "standard");
        }
    }, [data.type]);

    // Update amount and properties when pricing model changes
    useEffect(() => {
        if (data.pricing_model === "standard") {
            setData("properties", null);
            if (data.amount === null) {
                setData("amount", 0);
            }
        } else {
            setData("amount", null);
        }
    }, [data.pricing_model]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Set properties based on pricing model
        let properties = null;
        if (data.pricing_model !== "standard") {
            switch (data.pricing_model) {
                case "volume":
                case "graduated":
                    properties = { tiers };
                    break;
                case "package":
                    properties = { package: packageConfig };
                    break;
            }
            
            setData('properties', properties);
        }

        if (initialData?.id) {
            put(route('offers.variants.update', { offer: offerId, variant: initialData.id }), {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                },
            });
        } else {
            post(route('offers.variants.store', { offer: offerId }), {
                preserveScroll: true,
                onSuccess: () => {
                    onOpenChange(false);
                },
            });
        }
    };

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
            [field]: value,
        };

        if (field === 'to' && value !== null && index < newTiers.length - 1) {
            newTiers[index + 1].from = value;
        }

        setTiers(newTiers);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{initialData?.id ? 'Edit' : 'Add'} Price Variant</DialogTitle>
                    <DialogDescription>
                        {initialData?.id
                            ? 'Update the pricing details for this variant.'
                            : 'Create a new pricing variant for your product.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            placeholder="e.g., Basic Plan"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-500">{errors.name}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={data.description}
                            onChange={e => setData('description', e.target.value)}
                            placeholder="Describe this pricing variant"
                        />
                        {errors.description && (
                            <p className="text-sm text-red-500">{errors.description}</p>
                        )}
                    </div>

                    <div className="grid gap-2">
                        <Label>Variant Image</Label>
                        <ImageUpload
                            value={data.media_id}
                            onChange={(mediaId) => setData('media_id', mediaId)}
                            preview={initialData?.media?.url}
                            disabled={processing}
                        />
                        {errors.media_id && (
                            <p className="text-sm text-red-500">{errors.media_id}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="type">Type</Label>
                            <Select
                                value={data.type}
                                onValueChange={(value: VariantType) => setData('type', value)}
                            >
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="one_time">One Time</SelectItem>
                                    <SelectItem value="subscription">Subscription</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && (
                                <p className="text-sm text-red-500">{errors.type}</p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="pricing_model">Pricing Model</Label>
                            <Select
                                value={data.pricing_model}
                                onValueChange={(value: PricingModel) => setData('pricing_model', value)}
                            >
                                <SelectTrigger id="pricing_model">
                                    <SelectValue placeholder="Select model" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="standard">Standard (Flat Rate)</SelectItem>
                                    {data.type === "subscription" && (
                                        <>
                                            <SelectItem value="graduated">Graduated (Progressive)</SelectItem>
                                            <SelectItem value="volume">Volume (Quantity Based)</SelectItem>
                                        </>
                                    )}
                                    <SelectItem value="package">Package (Unit Based)</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.pricing_model && (
                                <p className="text-sm text-red-500">{errors.pricing_model}</p>
                            )}
                        </div>
                    </div>

                    {data.pricing_model === "standard" && (
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Amount (in cents)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={data.amount || 0}
                                onChange={e => setData('amount', Number(e.target.value))}
                            />
                            {errors.amount && (
                                <p className="text-sm text-red-500">{errors.amount}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                                Enter the amount in cents (e.g., 1000 for $10.00)
                            </p>
                        </div>
                    )}

                    {(data.pricing_model === "volume" || data.pricing_model === "graduated") && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-2">
                                    {tiers.map((tier, index) => (
                                        <div
                                            key={index}
                                            className="flex space-x-2 items-end rounded-md border bg-muted/40 p-2"
                                        >
                                            <div className="grid gap-2 flex-1">
                                                <Label className="text-xs">From</Label>
                                                <Input
                                                    type="number"
                                                    value={tier.from}
                                                    onChange={(e) => updateTier(index, 'from', Number(e.target.value))}
                                                    disabled={index > 0}
                                                    className="h-8"
                                                />
                                            </div>

                                            <div className="grid gap-2 flex-1">
                                                <Label className="text-xs">To</Label>
                                                <Input
                                                    type="number"
                                                    value={tier.to === null ? '' : tier.to}
                                                    onChange={(e) => updateTier(index, 'to', e.target.value ? Number(e.target.value) : null)}
                                                    placeholder="∞"
                                                    className="h-8"
                                                />
                                            </div>

                                            <div className="grid gap-2 flex-1">
                                                <Label className="text-xs">Unit Amount (¢)</Label>
                                                <Input
                                                    type="number"
                                                    value={tier.unit_amount}
                                                    onChange={(e) => updateTier(index, 'unit_amount', Number(e.target.value))}
                                                    className="h-8"
                                                />
                                            </div>

                                            {data.pricing_model === "graduated" && (
                                                <div className="grid gap-2 flex-1">
                                                    <Label className="text-xs">Flat Amount (¢)</Label>
                                                    <Input
                                                        type="number"
                                                        value={tier.flat_amount || 0}
                                                        onChange={(e) => {
                                                            const newTiers = [...tiers];
                                                            newTiers[index] = {
                                                                ...newTiers[index],
                                                                flat_amount: Number(e.target.value),
                                                            };
                                                            setTiers(newTiers);
                                                        }}
                                                        className="h-8"
                                                    />
                                                </div>
                                            )}

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
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {data.pricing_model === "package" && (
                        <Card>
                            <CardContent className="pt-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="package_size">Package Size</Label>
                                        <Input
                                            id="package_size"
                                            type="number"
                                            min="1"
                                            value={packageConfig.size}
                                            onChange={(e) => setPackageConfig({
                                                ...packageConfig,
                                                size: Number(e.target.value)
                                            })}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Number of units per package
                                        </p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="package_price">Package Price (in cents)</Label>
                                        <Input
                                            id="package_price"
                                            type="number"
                                            value={packageConfig.unit_amount}
                                            onChange={(e) => setPackageConfig({
                                                ...packageConfig,
                                                unit_amount: Number(e.target.value)
                                            })}
                                        />
                                        <p className="text-sm text-muted-foreground">
                                            Price per package in cents
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid gap-2">
                        {/* Display errors for hidden/computed fields */}
                        {errors.properties && (
                            <p className="text-sm text-red-500">{errors.properties}</p>
                        )}
                        {errors.currency && (
                            <p className="text-sm text-red-500">{errors.currency}</p>
                        )}
                    </div>

                    <div className="flex justify-end space-x-2">
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
                            className="relative transition-all duration-200 active:scale-95"
                        >
                            <div className={`${processing ? 'opacity-0' : 'opacity-100'} transition-opacity`}>
                                {initialData?.id ? 'Update' : 'Create'} Variant
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
