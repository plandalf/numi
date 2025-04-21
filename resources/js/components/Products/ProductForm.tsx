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
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { type Product } from "@/types/product"; // Assuming you have a Product type
import { toast } from "sonner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Integration } from "@/types/integration";
interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Product;
    integrations: Integration[];
}

const slugify = (text: string): string => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_')        // Replace spaces with _
        .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
        .replace(/\-\-+/g, '_')      // Replace multiple - with single _
        .replace(/^-+/, '')          // Trim - from start of text
        .replace(/-+$/, '');         // Trim - from end of text
};

export default function ProductForm({ open, onOpenChange, initialData, integrations }: Props) {
    const isEditing = !!initialData;
    const [isLookupKeyManuallyEdited, setIsLookupKeyManuallyEdited] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm<{
        name: string;
        lookup_key: string;
        integration_id: number | null;
        gateway_provider: string | null;
        gateway_product_id: string | null;
    }>({
        name: initialData?.name || "",
        lookup_key: initialData?.lookup_key || "",
        integration_id: initialData?.integration_id || null,
        gateway_provider: initialData?.gateway_provider || null,
        gateway_product_id: initialData?.gateway_product_id || null,
    });

    useEffect(() => {
        if (initialData) {
            setData({
                name: initialData.name || "",
                lookup_key: initialData.lookup_key || "",
                integration_id: initialData.integration_id || null,
                gateway_provider: initialData.gateway_provider || null,
                gateway_product_id: initialData.gateway_product_id || null,
            });
            setIsLookupKeyManuallyEdited(true); // Consider existing products as manually edited
        } else {
            reset();
            setIsLookupKeyManuallyEdited(false);
        }
    }, [initialData, open]);

    // Update lookup_key when name changes if not manually edited
    useEffect(() => {
        if (!isLookupKeyManuallyEdited && data.name) {
            setData('lookup_key', slugify(data.name));
        }
    }, [data.name, isLookupKeyManuallyEdited]);

    const handleLookupKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsLookupKeyManuallyEdited(true);
        setData('lookup_key', e.target.value);
    };

    const handleLookupKeyBlur = () => {
        // Always format the lookup key on blur, even if manually edited
        setData('lookup_key', slugify(data.lookup_key));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const productName = data.name || (isEditing ? 'this product' : 'new product');
        const toastId = toast.loading(isEditing ? `Updating ${productName}...` : `Creating ${productName}...`);

        if (isEditing) {
            put(route("products.update", initialData.id), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Product ${productName} updated successfully`, { id: toastId });
                    onOpenChange(false);
                },
                onError: (errors) => {
                    toast.error(`Failed to update product: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
                },
            });
        } else {
            post(route("products.store"), {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(`Product ${productName} created successfully`, { id: toastId });
                    onOpenChange(false);
                    reset();
                    setIsLookupKeyManuallyEdited(false);
                },
                onError: (errors) => {
                    toast.error(`Failed to create product: ${Object.values(errors).flat().join(", ")}`, { id: toastId });
                },
            });
        }
    };

    console.log(initialData);
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Edit" : "Create"} Product</DialogTitle>
                    <DialogDescription>
                        {isEditing
                            ? "Update the details of this product."
                            : "Add a new product to your catalog."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                            id="name"
                            autoComplete="off"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                            placeholder="e.g., Standard Subscription"
                            disabled={processing}
                        />
                        {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="lookup_key">Lookup Key</Label>
                        <Input
                            id="lookup_key"
                            autoComplete="off"
                            value={data.lookup_key}
                            onChange={handleLookupKeyChange}
                            onBlur={handleLookupKeyBlur}
                            placeholder="e.g., standard_sub_monthly (unique)"
                            disabled={processing}
                        />
                        {errors.lookup_key && (
                            <p className="text-sm text-red-500">{errors.lookup_key}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            A unique identifier for this product within your organization. {!isLookupKeyManuallyEdited && "Will update automatically based on name."}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="integration_id">Integration</Label>
                        <Select
                            value={data.integration_id?.toString() || ""}
                            onValueChange={(value) => setData("integration_id", value ? parseInt(value) : null)}
                            disabled={processing || (initialData && initialData.integration_id !== null)}
                        >
                            <SelectTrigger id="integration_id" className="w-full">
                                <SelectValue placeholder="Select an integration" />
                            </SelectTrigger>
                            <SelectContent>
                                {integrations.map((integration) => (
                                    <SelectItem key={integration.id} value={integration.id.toString()}>
                                        {integration.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.integration_id && (
                            <p className="text-sm text-red-500">{errors.integration_id}</p>
                        )}
                    </div>
                    {/* Optional Gateway Fields */}
                    {/* Consider adding these if needed */}
                    {/* <div className="grid gap-2">
                        <Label htmlFor="gateway_provider">Gateway Provider (Optional)</Label>
                        <Input
                            id="gateway_provider"
                            value={data.gateway_provider || ''}
                            onChange={(e) => setData("gateway_provider", e.target.value || null)}
                            placeholder="e.g., stripe"
                            disabled={processing}
                        />
                        {errors.gateway_provider && <p className="text-sm text-red-500">{errors.gateway_provider}</p>}
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="gateway_product_id">Gateway Product ID (Optional)</Label>
                        <Input
                            id="gateway_product_id"
                            value={data.gateway_product_id || ''}
                            onChange={(e) => setData("gateway_product_id", e.target.value || null)}
                            placeholder="e.g., prod_xxxxxxxxxxxxxx"
                            disabled={processing}
                        />
                        {errors.gateway_product_id && <p className="text-sm text-red-500">{errors.gateway_product_id}</p>}
                    </div> */}


                    <div className="flex justify-end space-x-2 pt-4">
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
                            <div className={`${processing ? "opacity-0" : "opacity-100"} transition-opacity`}>
                                {isEditing ? "Update" : "Create"} Product
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