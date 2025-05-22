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
import { type Product } from "@/types/offer"; // Changed from @/types/product
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ImageUpload } from "../ui/image-upload";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Product;
  hideDialog?: boolean;
  onSuccess?: (product: Product) => void;
}

interface ApiValidationError {
  message: string;
  errors: {
    [key: string]: string[];
  };
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

export default function ProductForm({
  open,
  onOpenChange,
  initialData,
  hideDialog = false,
  onSuccess
}: Props) {
  const isEditing = !!initialData;
  const [isLookupKeyManuallyEdited, setIsLookupKeyManuallyEdited] = useState(false);

  const { data, setData, post, put, processing, errors, reset } = useForm<{
    name: string;
    lookup_key: string;
    integration_id: number | null;
    gateway_provider: string | null;
    gateway_product_id: string | null;
    image: string | null;
  }>({
    name: initialData?.name || "",
    lookup_key: initialData?.lookup_key || "",
    integration_id: initialData?.integration_id || null,
    gateway_provider: initialData?.gateway_provider || null,
    gateway_product_id: initialData?.gateway_product_id || null,
    image: initialData?.image || null,
  });

  useEffect(() => {
    if (initialData) {
      setData({
        name: initialData.name || "",
        lookup_key: initialData.lookup_key || "",
        integration_id: initialData.integration_id || null,
        gateway_provider: initialData.gateway_provider || null,
        gateway_product_id: initialData.gateway_product_id || null,
        image: initialData.image || null,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productName = data.name || (isEditing ? 'this product' : 'new product');
    const toastId = toast.loading(isEditing ? `Updating ${productName}...` : `Creating ${productName}...`);

    try {
      const response = await fetch(
        isEditing ? route("products.update", initialData.id) : route("products.store"),
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          },
          body: JSON.stringify(data)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw result as ApiValidationError;
      }

      toast.success(`Product ${productName} ${isEditing ? 'updated' : 'created'} successfully`, { id: toastId });

      if (onSuccess && result.product) {
        onSuccess(result.product);
      } else {
        onOpenChange(false);
      }

      if (!isEditing) {
        reset();
        setIsLookupKeyManuallyEdited(false);
      }
    } catch (error) {
      const apiError = error as ApiValidationError;
      const errorMessage = apiError.message || `Failed to ${isEditing ? 'update' : 'create'} product`;
      toast.error(errorMessage, { id: toastId });

      // If the error response contains validation errors
      if (apiError.errors) {
        // Type assertion to handle the dynamic keys
        setData(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(apiError.errors).map(([key, messages]) => [key, messages[0]])
          )
        }));
      }
    }
  };

  const content = (
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
          placeholder="e.g., standard_subscription"
          disabled={processing}
        />
        {errors.lookup_key && <p className="text-sm text-red-500">{errors.lookup_key}</p>}
        <p className="text-xs text-muted-foreground">
          A unique identifier for this product within your organization. {!isLookupKeyManuallyEdited && "Will update automatically based on name."}
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Product Image</Label>
        <ImageUpload
          preview={data.image}
          onChange={(value) => setData("image", value)}
        />
      </div>
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
  );

  if (hideDialog) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit" : "Create"} Product</DialogTitle>
          <DialogDescription>
            Create a new product to sell
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
