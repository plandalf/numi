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
import { formatMoney, slugify, getSupportedCurrencies } from "@/lib/utils"; // Import slugify and getSupportedCurrencies
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

interface MetadataEntry {
  tag_name: string;
  copy: string;
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
  metadata: MetadataEntry[];
}

interface ApiValidationError {
  message: string;
  errors: {
    [key: string]: string[];
  };
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  initialData?: Price; // For editing
  listPrices?: Price[]; // For custom scope parent selection
  onSuccess?: (price: Price) => void;
  hideDialog?: boolean;
  useJsonResponse?: boolean; // Add new prop to control response type
}

// Add a type for Inertia page response
interface InertiaPageResponse {
  props: {
    price?: Price;
    [key: string]: any;
  };
}

export default function PriceForm({
  open,
  onOpenChange,
  product,
  initialData,
  listPrices,
  onSuccess,
  hideDialog = false,
  useJsonResponse = false // Default to Inertia redirect
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
    metadata: initialData?.metadata || [],
  });

  const [showMetadata, setShowMetadata] = useState(getInitialFormData().metadata.length > 0);

  const { data, setData, post, put, processing, errors, reset } = useForm<PriceFormData>(getInitialFormData());

  // Reset form and properties state when dialog closes or initialData changes
  useEffect(() => {
    if (!open) {
      reset();
      setTiers([{ from: 0, to: null, unit_amount: 0 }]);
      setPackageConfig({ size: 1, unit_amount: 0 });
      setIsLookupKeyManuallyEdited(false);
      setShowMetadata(false);
    } else {
      setData(getInitialFormData());
      setTiers(initialData?.properties?.tiers || [{ from: 0, to: null, unit_amount: 0 }]);
      setPackageConfig(initialData?.properties?.package || { size: 1, unit_amount: 0 });
      setIsLookupKeyManuallyEdited(!!initialData?.lookup_key);
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

  const addMetadataEntry = () => {
    const newEntries = [...data.metadata, { tag_name: '', copy: '' }];
    setData('metadata', newEntries);
  };

  const removeMetadataEntry = (index: number) => {
    const newEntries = data.metadata.filter((_, i) => i !== index);
    setData('metadata', newEntries);
  };

  const updateMetadataEntry = (index: number, field: keyof MetadataEntry, value: string) => {
    const newEntries = [...data.metadata];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setData('metadata', newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceName = data.name || (isEditing ? 'this price' : 'new price');
    const toastId = toast.loading(isEditing ? `Updating ${priceName}...` : `Creating ${priceName}...`);

    // Prepare the data for submission
    const formData = { ...data };

    // Handle complex pricing models
    if (['tiered', 'volume', 'graduated'].includes(data.type)) {
      formData.properties = { tiers };
    } else if (data.type === 'package') {
      formData.properties = { package: packageConfig };
    } else if (showMetadata || data.metadata.length > 0) {
      formData.properties = { metadata: data.metadata };
    } else {
      formData.properties = null;
    }

    // Clear recurring fields if not needed
    if (data.type !== 'recurring') {
      formData.renew_interval = null;
      formData.recurring_interval_count = null;
      formData.billing_anchor = null;
    }

    // Format data
    formData.amount = Math.round(data.amount);
    formData.lookup_key = formData.lookup_key?.trim() || null;

    // Set data back to the form (for both Inertia and JSON API methods)
    setData(formData);

    // If using Inertia redirect, use Inertia's form submission
    if (!useJsonResponse) {
      // Use Inertia's form submission which handles redirects automatically
      if (isEditing && initialData) {
        put(route('products.prices.update', { product: product.id, price: initialData.id }), {
          onSuccess: () => {
            toast.success(`Price ${priceName} updated successfully`, { id: toastId });
            onOpenChange(false);
          },
          onError: () => {
            toast.error(`Failed to update price`, { id: toastId });
          }
        });
      } else {
        post(route('products.prices.store', { product: product.id }), {
          onSuccess: () => {
            toast.success(`Price ${priceName} created successfully`, { id: toastId });
            onOpenChange(false);
            reset();
          },
          onError: () => {
            toast.error(`Failed to create price`, { id: toastId });
          }
        });
      }
      return;
    }

    // For JSON responses, use fetch API
    try {
      const url = isEditing
        ? route('products.prices.update', { product: product.id, price: initialData!.id })
        : route('products.prices.store', { product: product.id });

      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
        body: JSON.stringify(formData)
      });

      // Check if response is a redirect
      if (response.redirected) {
        toast.success(`Price ${priceName} ${isEditing ? 'updated' : 'created'} successfully`, { id: toastId });
        window.location.href = response.url;
        return;
      }

      const result = await response.json();

      if (!response.ok) {
        throw result as ApiValidationError;
      }

      toast.success(`Price ${priceName} ${isEditing ? 'updated' : 'created'} successfully`, { id: toastId });

      if (onSuccess && result.price) {
        onSuccess(result.price);
      } else {
        onOpenChange(false);
      }

      if (!isEditing) {
        reset();
      }
    } catch (error) {
      const apiError = error as ApiValidationError;
      const errorMessage = apiError.message || `Failed to ${isEditing ? 'update' : 'create'} price`;
      toast.error(errorMessage, { id: toastId });

      // If the error response contains validation errors
      if (apiError.errors) {
        setData(prev => ({
          ...prev,
          ...Object.fromEntries(
            Object.entries(apiError.errors).map(([key, messages]) => [key, messages[0]])
          )
        }));
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

  const content = (
    <form onSubmit={handleSubmit} className="flex flex-col flex-grow min-h-0">
      <div className="flex-grow overflow-y-auto">
        <div className="flex flex-col gap-4 pb-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              autoComplete="off"
              value={data.name || ''}
              onChange={(e) => setData("name", e.target.value)}
              placeholder="e.g., Monthly Standard"
              disabled={processing}
              required
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lookup_key">Lookup Key</Label>
            <Input
              id="lookup_key"
              autoComplete="off"
              value={data.lookup_key || ''}
              onChange={handleLookupKeyChange}
              onBlur={handleLookupKeyBlur}
              placeholder="e.g., standard_monthly"
              disabled={processing}
              required
            />
            {errors.lookup_key && <p className="text-sm text-red-500">{errors.lookup_key}</p>}
            <p className="text-xs text-muted-foreground">
              A unique identifier for this product. Will update automatically based on name. {!isLookupKeyManuallyEdited && data.name && "Auto-generated from name."}
            </p>
          </div>

          <div className="text-sm text-teal-600 cursor-pointer" onClick={() => {
            const newShowMetadata = !showMetadata;
            setShowMetadata(newShowMetadata);
            if (newShowMetadata && data.metadata.length === 0) {
              addMetadataEntry();
            }
          }}>
            {showMetadata ? 'Hide Metadata' : 'Add Metadata tag'}
          </div>

          {showMetadata && (
            <Card className="bg-gray-50">
              <CardContent className="px-4 space-y-4">
                {data.metadata.map((entry, index) => (
                  <div key={index} className="flex flex-row gap-4 items-end">
                    <div className="flex flex-col gap-2 w-full">
                      <Label htmlFor={`tag_name_${index}`}>Tag name</Label>
                      <Input
                        id={`tag_name_${index}`}
                        type="text"
                        autoComplete="off"
                        value={entry.tag_name}
                        onChange={(e) => updateMetadataEntry(index, 'tag_name', e.target.value)}
                        disabled={processing}
                      />
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <Label htmlFor={`copy_${index}`}>Copy</Label>
                      <Input
                        id={`copy_${index}`}
                        type="text"
                        autoComplete="off"
                        value={entry.copy}
                        onChange={(e) => updateMetadataEntry(index, 'copy', e.target.value)}
                        disabled={processing}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMetadataEntry(index)}
                      disabled={processing}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addMetadataEntry}
                  disabled={processing}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Another Metadata
                </Button>

                {errors.properties && <p className="text-sm text-red-500">{errors.properties}</p>}
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col gap-2">
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
          <div className="flex flex-row gap-4">
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="amount">Amount (in cents)</Label>
              <Input
                id="amount"
                autoComplete="off"
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
            <div className="flex flex-col gap-2 w-full">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={data.currency}
                onValueChange={(value) => setData('currency', value.toLowerCase())}
                disabled={processing || isEditing}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {getSupportedCurrencies().map((currency) => (
                      <SelectItem key={currency.code} value={currency.code.toLowerCase()}>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {errors.currency && <p className="text-sm text-red-500">{errors.currency}</p>}
            </div>
          </div>

          {/* Recurring Fields */}
          {data.type === 'recurring' && (
            <Card className="bg-gray-50">
              <CardContent className="px-4 space-y-4">
                <div className="text-sm font-medium">Recurring Settings</div>
                <div className="flex flex-row gap-4 items-end">
                  <div className="flex flex-col gap-2 w-full">
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
                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="recurring_interval_count">Interval Count</Label>
                    <Input
                      id="recurring_interval_count"
                      autoComplete="off"
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
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="billing_anchor">Billing Anchor (Optional)</Label>
                  {/* Replace with Select if predefined anchors are known */}
                  <Input
                    id="billing_anchor"
                    autoComplete="off"
                    value={data.billing_anchor || ''}
                    onChange={e => setData('billing_anchor', e.target.value || null)}
                    disabled={processing}
                    placeholder="e.g., start_of_month"
                  />
                  {errors.billing_anchor && <p className="text-sm text-red-500">{errors.billing_anchor}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cancel_after_cycles">Cancel After Cycles (Optional)</Label>
                  <Input
                    id="cancel_after_cycles"
                    autoComplete="off"
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
            <Card className="bg-gray-50">
              <CardContent className="px-4 space-y-4">
                <div className="text-sm font-medium">Tiered Pricing Configuration</div>
                <div className="flex flex-col gap-4">
                  {tiers.map((tier, index) => (
                    <div
                      key={index}
                      className="flex space-x-2 items-end rounded-md border bg-background p-2"
                    >
                      <div className="grid gap-1 flex-1">
                        <Label className="text-xs">From (Units)</Label>
                        <Input
                          autoComplete="off"
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
                          autoComplete="off"
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
                          autoComplete="off"
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
            <Card className="bg-gray-50">
              <CardContent className="px-4 space-y-4">
                <div className="text-sm font-medium">Package Pricing Configuration</div>
                <div className="flex flex-row gap-4">
                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="package_size">Package Size (Units)</Label>
                    <Input
                      id="package_size"
                      autoComplete="off"
                      type="number"
                      min="1"
                      step="1"
                      value={packageConfig.size}
                      onChange={(e) => setPackageConfig({ ...packageConfig, size: Number(e.target.value) })}
                      disabled={processing}
                    />
                  </div>

                  <div className="flex flex-col gap-2 w-full">
                    <Label htmlFor="package_price">Package Price (¢)</Label>
                    <Input
                      id="package_price"
                      autoComplete="off"
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

        </div>
      </div>

      {/* Display general properties error if not caught above */}
      {errors.properties &&
        !['tiered', 'volume', 'graduated', 'package'].includes(data.type) && (
          <p className="text-sm text-red-500 pt-2">{errors.properties}</p>
        )}

      {/* Submit Button */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={processing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={processing}
          className="relative transition-all duration-200 active:scale-95"
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
  );

  if (hideDialog) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit' : 'Add'} Price</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update the details for this price on ${product.name}.`
              : `Add a new price for ${product.name}.`}
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
