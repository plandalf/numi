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
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { toast } from "sonner";
import { formatMoney, slugify, getSupportedCurrencies } from "@/lib/utils"; // Import slugify and getSupportedCurrencies
import { type Price, type Product } from '@/types/offer';
import axios from '@/lib/axios'; // Assuming types are centralized

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
  hideSuccessToast?: boolean;
}

// Add a type for Inertia page response
interface InertiaPageResponse {
  props: {
    price?: Price;
    [key: string]: any;
  };
}

// Add this helper above the component
const currencySymbols: Record<string, string> = {
  usd: '$',
  gbp: '£',
  jpy: '¥',
  cad: 'C$',
  aud: 'A$',
  nzd: 'NZ$',
};

// Helper functions for number formatting
const formatNumberWithCommas = (numStr: string): string => {
  if (!numStr) return "";
  const parts = numStr.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
};

const stripCommas = (numStr: string): string => {
  return numStr.replace(/,/g, '');
};

export default function PriceForm({
  open,
  onOpenChange,
  product,
  initialData,
  listPrices,
  onSuccess,
  hideDialog = false,
  useJsonResponse = false,
  hideSuccessToast = false
}: Props) {
  const isEditing = !!initialData;
  const { props: pageProps } = usePage<PageProps>();
  const defaultCurrency = product.currency || pageProps.config?.cashier_currency || 'usd'; // Get default currency
  const [isLookupKeyManuallyEdited, setIsLookupKeyManuallyEdited] = useState(!!initialData?.lookup_key); // Track manual edits
  const [amountDisplay, setAmountDisplay] = useState<string>("0.00"); // State for formatted amount string
  const amountInputRef = useRef<HTMLInputElement>(null); // Ref for amount input to check focus
  const [cursorPosition, setCursorPosition] = useState<number | null>(null); // For managing cursor

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
      setAmountDisplay("0.00"); // Reset amount display
    } else {
      const initialFormState = getInitialFormData();
      setData(initialFormState);
      // Format initial amount to display string
      const initialAmountStr = initialFormState.amount ? (initialFormState.amount / 100).toFixed(2) : "0.00";
      setAmountDisplay(formatNumberWithCommas(initialAmountStr));
      setTiers(initialData?.properties?.tiers || [{ from: 0, to: null, unit_amount: 0 }]);
      setPackageConfig(initialData?.properties?.package || { size: 1, unit_amount: 0 });
      setIsLookupKeyManuallyEdited(!!initialData?.lookup_key);
    }
  }, [open, initialData, reset, defaultCurrency, setData]);

  // Sync data.amount (cents) to amountDisplay (formatted string)
  // This effect runs when data.amount changes, but avoids interference if the input is focused.
  useEffect(() => {
    if (document.activeElement !== amountInputRef.current) {
      const amountStr = data.amount ? (data.amount / 100).toFixed(2) : "0.00";
      setAmountDisplay(formatNumberWithCommas(amountStr));
    }
  }, [data.amount]);

  useLayoutEffect(() => {
    if (cursorPosition !== null && amountInputRef.current) {
      amountInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      setCursorPosition(null); // Reset after applying
    }
  }, [amountDisplay, cursorPosition]);

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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const currentCursor = e.target.selectionStart;

    // Store the count of characters before the cursor that are not digits or a decimal point.
    // This helps adjust the cursor if formatting characters (like commas) are added/removed.
    let nonDigitCharsBeforeCursor = 0;
    if (currentCursor !== null) {
        for (let i = 0; i < currentCursor; i++) {
            if (!/[\d.]/.test(rawValue[i])) {
                nonDigitCharsBeforeCursor++;
            }
        }
    }

    const valueNoCommas = stripCommas(rawValue);

    let newDisplayValue = "";
    let newAmountInCents = 0;

    // Sanitize (allow digits, one decimal, max two decimal places)
    let sanitizedString = "";
    let hasDecimal = false;
    for (const char of valueNoCommas) {
      if (/\d/.test(char)) {
        if (char === '0' && sanitizedString === '0' && !hasDecimal) continue;
        sanitizedString += char;
      } else if (char === '.' && !hasDecimal) {
        if (sanitizedString === "") sanitizedString = "0";
        sanitizedString += char;
        hasDecimal = true;
      }
    }

    if (hasDecimal) {
      const parts = sanitizedString.split('.');
      if (parts[1] && parts[1].length > 2) {
        sanitizedString = parts[0] + '.' + parts[1].substring(0, 2);
      }
    } else {
      if (sanitizedString.length > 1 && sanitizedString.startsWith('0')) {
        sanitizedString = sanitizedString.replace(/^0+/, '') || "0";
      }
    }

    if (sanitizedString === "" || sanitizedString === "0" && valueNoCommas === "") {
      // Allow user to clear input, will format to "0.00" on blur
      newDisplayValue = "";
      newAmountInCents = 0;
    } else if (sanitizedString === "." || (sanitizedString === "0." && valueNoCommas.endsWith("."))) {
       // Handles typing "." or "0." - allows user to continue typing cents.
       // These will be formatted on blur or once more digits are added.
      newDisplayValue = sanitizedString; // Keep as is for now
      newAmountInCents = 0;
    }
     else {
      let valueForParsing = sanitizedString;
      if (valueForParsing.endsWith('.')) {
        valueForParsing += "00"; // Ensure "123." becomes "123.00" for consistency before parsing
      } else if (hasDecimal) {
        const parts = valueForParsing.split('.');
        valueForParsing = parts[0] + '.' + (parts[1] || "").padEnd(2, '0');
      } else { // No decimal, e.g. "123"
        valueForParsing += ".00";
      }

      const numericValue = parseFloat(valueForParsing);

      if (!isNaN(numericValue)) {
        newAmountInCents = Math.round(numericValue * 100);

        // Determine the display value based on the sanitized input
        // This ensures that if a user types "123.4", it shows "1,234.40" during input
        let formattedForDisplay;
        if (sanitizedString.includes('.')) {
            const parts = sanitizedString.split('.');
            formattedForDisplay = formatNumberWithCommas(parts[0]) + '.' + (parts[1] || "").padEnd(2, '0');
        } else { // Integer part only, or empty
            formattedForDisplay = formatNumberWithCommas(sanitizedString) + '.00';
        }
        newDisplayValue = formattedForDisplay;

      } else {
        newDisplayValue = amountDisplay; // Fallback, keep old
        newAmountInCents = data.amount;
      }
    }

    setAmountDisplay(newDisplayValue);
    setData('amount', newAmountInCents);

    // Cursor position adjustment
    if (currentCursor !== null) {
        // Calculate how many formatting chars (commas) are in the new display string *before* the equivalent raw input position
        let newNonDigitCharsBeforeCursor = 0;
        const strippedNewDisplay = stripCommas(newDisplayValue);

        // Determine the length of the "prefix" of the new display value that corresponds to the original input's prefix
        // This is complex because of dynamic formatting. A simpler approach:
        // Count commas in the new string up to where the numeric content would align with the old cursor.

        // More direct approach:
        // After stripping commas from rawValue, the currentCursor effectively points to a position in a numbers-and-dot string.
        // We want to find that same relative position in the newDisplayValue, accounting for newly added/removed commas.
        let newCursor = currentCursor;
        const newDisplayValueNoCommas = stripCommas(newDisplayValue);
        const oldPrefixNoCommas = stripCommas(rawValue.substring(0, currentCursor));
        let tempCursor = 0;
        let numEquivalentCharsCount = 0;

        for(let i=0; i < newDisplayValue.length; i++) {
            if(numEquivalentCharsCount >= oldPrefixNoCommas.length) break;
            tempCursor++;
            if(/[\d.]/.test(newDisplayValue[i])) {
                numEquivalentCharsCount++;
            }
        }
        // If rawValue was empty, and new is "0.00", place cursor at start.
        if(rawValue === "" && newDisplayValue === "0.00") {
            newCursor = 0;
        } else if (rawValue === "." && newDisplayValue === "0.00" ) { // From blur primarily
            newCursor = 1; // "0|.00"
        } else {
           newCursor = tempCursor;
        }


        // If the user backspaced and the value became empty (e.g. cleared "1.00")
        // and it then reformats to "0.00" on blur or later, this logic might need refinement.
        // The current logic tries to place the cursor based on the *numeric* content.

        // Special case for backspacing the first digit of cents: "1.20" -> delete "2" -> "1.00"
        // If original was "X.Y0" and Y was deleted, cursor should be before Y (now 0).
        // rawValue: "1.20", currentCursor at 3 (before 2) -> sanitized "1.0" -> display "1.00"
        // oldPrefixNoCommas = "1."
        // newDisplayValue = "1.00"
        // tempCursor should become 3 (1.00)

        // If backspacing ".00" to just "."
        if (valueNoCommas === "." && newDisplayValue === ".") {
            newCursor = 1; // Keep cursor after dot
        } else if (valueNoCommas === "" && newDisplayValue === "") {
            newCursor = 0;
        }


        setCursorPosition(newCursor);
    }
  };

  const handleAmountBlur = () => {
    const valueNoCommas = stripCommas(amountDisplay);
    let numericValue = parseFloat(valueNoCommas);

    if (isNaN(numericValue) || valueNoCommas.trim() === "" || valueNoCommas.trim() === ".") {
      numericValue = 0;
    }
    const fixedValue = numericValue.toFixed(2); // "0.00", "123.50"
    const formattedWithCommas = formatNumberWithCommas(fixedValue);

    setAmountDisplay(formattedWithCommas);
    setData('amount', Math.round(numericValue * 100));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceName = data.name || (isEditing ? 'this price' : 'new price');
    const toastId = !hideSuccessToast ? toast.loading(isEditing ? `Updating ${priceName}...` : `Creating ${priceName}...`) : undefined;

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
            if (!hideSuccessToast) {
              toast.success(`Price ${priceName} updated successfully`, { id: toastId });
            }
            onOpenChange(false);
          },
          onError: () => {
            toast.error(`Failed to update price`, { id: toastId });
          }
        });
      } else {
        post(route('products.prices.store', { product: product.id }), {
          onSuccess: () => {
            if (!hideSuccessToast) {
              toast.success(`Price ${priceName} created successfully`, { id: toastId });
            }
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

      const method = isEditing ? 'put' : 'post';

      const response = await axios({
        method,
        url,
        data: formData,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      // Handle response
      const result = response.data;

      if (!hideSuccessToast) {
        toast.success(`Price ${priceName} ${isEditing ? 'updated' : 'created'} successfully`, { id: toastId });
      }


      if (onSuccess && result.price) {
        onSuccess(result.price);
      } else {
        onOpenChange(false);
        if (response.request.responseURL && response.request.responseURL !== window.location.href) {
          window.location.href = response.request.responseURL;
          return;
        }
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
              className="bg-white"
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
              className="bg-white"
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
            <Card className="bg-[#F7F9FF]">
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
                        className="bg-white"
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
                        className="bg-white"
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
                <SelectItem value="package">Package (Unit Based)</SelectItem>
                <SelectItem value="tiered">Tiered (Usage Based)</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
          </div>

          {/* Amount + Currency Composite Input */}
          <div className="flex flex-col gap-2 w-full">
            <Label htmlFor="amount">Amount <span className="text-xs text-muted-foreground">(required)</span></Label>
            <div className="flex w-full items-center rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring transition-colors">
              {/* Currency Symbol Prefix */}
              <span className="flex items-center px-3 text-muted-foreground text-base select-none">
                {currencySymbols[data.currency?.toLowerCase?.()] || data.currency?.toUpperCase?.() || '$'}
              </span>
              {/* Amount Input */}
              <Input
                id="amount"
                autoComplete="off"
                type="text"
                inputMode="decimal"
                value={amountDisplay}
                onChange={handleAmountChange}
                onBlur={handleAmountBlur}
                ref={amountInputRef}
                disabled={processing || ['tiered', 'volume', 'graduated', 'package'].includes(data.type)}
                className="border-0 focus:ring-0 focus:border-none rounded-none flex-1 min-w-0 px-2 text-base bg-white shadow-none"
                style={{ boxShadow: 'none' }}
                aria-describedby="amount-currency-addon"
              />
              {/* Currency Abbreviation Suffix with Dropdown */}
              <Select
                value={data.currency}
                onValueChange={(value) => setData('currency', value.toLowerCase())}
                disabled={processing || isEditing}
              >
                <SelectTrigger id="amount-currency-addon" className="rounded-none border-0 bg-transparent px-3 h-9 min-w-[64px] w-auto text-base focus:ring-0 focus:border-none">
                  <SelectValue>{data.currency?.toUpperCase?.()}</SelectValue>
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
            </div>
            {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
            {errors.currency && <p className="text-sm text-red-500">{errors.currency}</p>}
            <p className="text-xs text-muted-foreground">Enter the price. Not used for complex models.</p>
          </div>

          {/* Recurring Fields */}
          {data.type === 'recurring' && (
            <Card className="bg-[#F7F9FF]">
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
                      className="bg-white"
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
                    className="bg-white"
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
                    className="bg-white"
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
            <Card className="bg-[#F7F9FF]">
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
                          className="h-8 bg-white"
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
                          className="h-8 bg-white"
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
                          className="h-8 bg-white"
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
            <Card className="bg-[#F7F9FF]">
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
                      className="bg-white"
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
                      className="bg-white"
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
