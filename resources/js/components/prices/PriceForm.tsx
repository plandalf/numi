import { useForm, usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogActions, DialogBody, DialogContent,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from '@headlessui/react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Combobox } from "@/components/combobox";
import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { toast } from "sonner";
import { formatMoney, slugify, getSupportedCurrencies } from "@/lib/utils"; // Import slugify and getSupportedCurrencies
import { type Price, type Product } from '@/types/offer';
import axios from '@/lib/axios';
// Inline Stripe price search within the modal instead of a separate dialog


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
type PriceScope = 'list' | 'custom' | 'variant';

// Stripe API shapes (subset used for prefill)
interface StripeRecurring {
  interval: RecurringInterval | string;
  interval_count: number;
  usage_type: string;
}

interface StripeTier {
  flat_amount?: number | null;
  unit_amount?: number | null;
  up_to?: number | null;
}

interface StripePriceLite {
  id: string;
  nickname?: string | null;
  lookup_key?: string | null;
  active?: boolean;
  type: 'recurring' | 'one_time';
  recurring?: StripeRecurring;
  tiers?: StripeTier[];
  unit_amount: number | null;
  currency: string;
  tiers_mode?: 'volume' | 'graduated' | string | null;
  billing_scheme?: 'tiered' | 'per_unit' | string | null;
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // Add index signature for form compatibility
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  initialData?: Partial<Price>; // For editing
  listPrices?: Price[]; // For custom scope parent selection
  onSuccess?: (price: Price) => void;
  hideDialog?: boolean;
  useJsonResponse?: boolean; // Add new prop to control response type
  hideSuccessToast?: boolean;
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

const capitalize = (str: string | undefined | null): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// Normalize various currency representations to a 3-letter lowercase code
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizeCurrencyCode = (value: any, fallback: string = 'usd'): string => {
  if (!value) return fallback;
  if (typeof value === 'string') return value.toLowerCase();
  if (typeof value === 'object') {
    if (typeof value.code === 'string') return value.code.toLowerCase();
    if (typeof value.currency === 'string') return value.currency.toLowerCase();
  }
  return fallback;
};

// Convert backend-normalized properties (either array of tiers or { tiers: [] })
// into UI-friendly TierConfig with from/to boundaries
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const computeTiersFromProperties = (props: any): TierConfig[] => {
  // Handle both shapes: array or { tiers: [] }
  const tiersSource = Array.isArray(props) ? props : (props?.tiers ?? null);
  if (!Array.isArray(tiersSource) || tiersSource.length === 0) {
    return [{ from: 0, to: null, unit_amount: 0 }];
  }
  // Sort by up_to ascending (null last)
  const sorted = [...tiersSource].sort((a, b) => {
    const aU = (a?.up_to ?? Number.POSITIVE_INFINITY) as number;
    const bU = (b?.up_to ?? Number.POSITIVE_INFINITY) as number;
    return aU - bU;
  });
  // Build from/to
  const result: TierConfig[] = [];
  let prevUpTo: number | null = null;
  for (let i = 0; i < sorted.length; i++) {
    const t = sorted[i] ?? {};
    const upTo: number | null = typeof t.up_to === 'number' ? t.up_to : null;
    const from = prevUpTo === null ? 0 : prevUpTo + 1;
    const to = upTo;
    const unitAmount = typeof t.unit_amount === 'number' ? t.unit_amount : 0;
    const flatAmount = typeof t.flat_amount === 'number' ? t.flat_amount : null;
    result.push({ from, to, unit_amount: unitAmount, flat_amount: flatAmount });
    if (upTo !== null) prevUpTo = upTo;
  }
  return result;
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
  const isEditing = !!(initialData?.id);
  const { props: pageProps } = usePage<PageProps>();
  const defaultCurrency = normalizeCurrencyCode((product as unknown as { currency?: unknown }).currency || pageProps.config?.cashier_currency || 'usd');
  const [isLookupKeyManuallyEdited, setIsLookupKeyManuallyEdited] = useState(!!initialData?.lookup_key); // Track manual edits
  const [amountDisplay, setAmountDisplay] = useState<string>("0.00"); // State for formatted amount string
  const amountInputRef = useRef<HTMLInputElement>(null); // Ref for amount input to check focus
  const [cursorPosition, setCursorPosition] = useState<number | null>(null); // For managing cursor
  const [stripePrices, setStripePrices] = useState<StripePriceLite[]>([]);
  const [isLoadingStripePrices, setIsLoadingStripePrices] = useState<boolean>(false);

  // --- State for complex properties ---
  const [tiers, setTiers] = useState<TierConfig[]>(computeTiersFromProperties(initialData?.properties));
  const [packageConfig, setPackageConfig] = useState<PackageConfig>(initialData?.properties?.package || { size: 1, unit_amount: 0 });
  // --- End State ---

  // Define initial state structure
  const getInitialFormData = useCallback((): PriceFormData => {
    const type = initialData?.type || 'one_time';
    const isRecurringType = ['recurring', 'tiered', 'volume', 'graduated', 'package'].includes(type);

    return {
      name: initialData?.name || null,
      lookup_key: initialData?.lookup_key || null,
      scope: initialData?.scope || 'list',
      parent_list_price_id: initialData?.parent_list_price_id || null,
      type,
      amount: initialData?.amount || 0,
      currency: normalizeCurrencyCode((initialData as unknown as { currency?: unknown })?.currency) || defaultCurrency,
      renew_interval: initialData?.renew_interval || (isRecurringType ? 'month' : null),
      billing_anchor: initialData?.billing_anchor || null,
      recurring_interval_count: initialData?.recurring_interval_count || null,
      cancel_after_cycles: initialData?.cancel_after_cycles || null,
      properties: initialData?.properties || null,
      is_active: initialData?.is_active === undefined ? true : initialData.is_active,
      gateway_provider: initialData?.gateway_provider || null,
      gateway_price_id: initialData?.gateway_price_id || null,
      metadata: initialData?.metadata || [],
    };
  }, [initialData, defaultCurrency]);

  const [showMetadata, setShowMetadata] = useState(getInitialFormData().metadata.length > 0);
  const [isRecurringSettingsExpanded, setIsRecurringSettingsExpanded] = useState(() => {
    // Auto-expand if there are existing values or errors
    const formData = getInitialFormData();
    return !!(formData.cancel_after_cycles ||
              (formData.renew_interval && formData.renew_interval !== 'month'));
  });

  const { data, setData, post, put, processing, errors, reset } = useForm<PriceFormData>(getInitialFormData());
  const [isDebugOpen, setIsDebugOpen] = useState<boolean>(false);

  // Reset form and properties state when dialog closes or initialData changes
  useEffect(() => {
    if (!open) {
      reset();
      setTiers([{ from: 0, to: null, unit_amount: 0 }]);
      setPackageConfig({ size: 1, unit_amount: 0 });
      setIsLookupKeyManuallyEdited(false);
      setShowMetadata(false);
      setIsRecurringSettingsExpanded(false);
      setAmountDisplay("0.00"); // Reset amount display
    } else {
      const initialFormState = getInitialFormData();
      setData(initialFormState);
      // Format initial amount to display string
      const initialAmountStr = initialFormState.amount ? (initialFormState.amount / 100).toFixed(2) : "0.00";
      setAmountDisplay(formatNumberWithCommas(initialAmountStr));
      setTiers(computeTiersFromProperties(initialData?.properties));
      setPackageConfig(initialData?.properties?.package || { size: 1, unit_amount: 0 });
      setIsLookupKeyManuallyEdited(!!initialData?.lookup_key);
    }
  }, [open, initialData, reset, defaultCurrency, setData, getInitialFormData]);

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
    if (data.type === 'one_time') {
      setData('renew_interval', null);
      setData('recurring_interval_count', null);
      setData('billing_anchor', null);
    } else if (['recurring', 'tiered', 'volume', 'graduated', 'package'].includes(data.type)) {
      // Set sensible defaults for recurring types if not already set
      if (!data.renew_interval) {
        setData('renew_interval', 'month');
      }
    }
  }, [data.type, data.renew_interval, setData]);

  // Auto-expand recurring settings if there are errors
  useEffect(() => {
    if (errors.renew_interval || errors.cancel_after_cycles) {
      setIsRecurringSettingsExpanded(true);
    }
  }, [errors.renew_interval, errors.cancel_after_cycles]);

  // Update parent_list_price_id based on scope
  useEffect(() => {
    if (data.scope === 'list') {
      setData('parent_list_price_id', null);
    }
  }, [data.scope, setData]);

  // Ensure child type always matches selected parent type for custom/variant
  useEffect(() => {
    if ((data.scope === 'custom' || data.scope === 'variant') && data.parent_list_price_id && listPrices && listPrices.length > 0) {
      const parent = listPrices.find(p => p.id === data.parent_list_price_id);
      if (parent && data.type !== parent.type) {
        setData('type', parent.type);
      }
    }
  }, [data.scope, data.parent_list_price_id, listPrices, data.type, setData]);

  // Resolve integration/product ids (supports both product.integration.id and product.integration_id shapes)
  const resolvedIntegrationId = (product as unknown as { integration?: { id?: number } }).integration?.id
    ?? (product as unknown as { integration_id?: number }).integration_id;
  const resolvedGatewayProductId = (product as unknown as { gateway_product_id?: string }).gateway_product_id;

  // Fetch Stripe prices for the connected product (if available)
  useEffect(() => {
    if (!open) return;
    if (!resolvedIntegrationId || !resolvedGatewayProductId) return;
    setIsLoadingStripePrices(true);
    axios
      .get(`/integrations/${resolvedIntegrationId}/products/${resolvedGatewayProductId}/prices`)
      .then((res) => setStripePrices((res.data || []) as StripePriceLite[]))
      .catch(() => setStripePrices([]))
      .finally(() => setIsLoadingStripePrices(false));
  }, [open, resolvedIntegrationId, resolvedGatewayProductId]);

  const prefillFromStripePrice = (stripePrice: StripePriceLite) => {
    if (!stripePrice) return;
    setData('gateway_provider', 'stripe');
    setData('gateway_price_id', stripePrice.id);
    // Compute a sensible name and lookup key
    const intervalLabel = stripePrice.recurring ? capitalize(String(stripePrice.recurring.interval)) : '';
    const typeLabel = (() => {
      if (Array.isArray(stripePrice.tiers) && stripePrice.tiers.length > 0) {
        if (stripePrice.tiers_mode === 'volume') return 'Volume';
        if (stripePrice.tiers_mode === 'graduated' || stripePrice.billing_scheme === 'tiered') return 'Graduated';
      }
      return stripePrice.type === 'recurring' ? 'Recurring' : 'One-time';
    })();
    const amountLabel = typeof stripePrice.unit_amount === 'number' && stripePrice.unit_amount !== null
      ? `${formatMoney(stripePrice.unit_amount, stripePrice.currency)}`
      : '';
    const defaultName = [product.name, amountLabel, intervalLabel || typeLabel].filter(Boolean).join(' ').trim();
    const desiredName = stripePrice.nickname || defaultName;
    setData('name', desiredName);
    const desiredLookup = stripePrice.lookup_key || slugify(desiredName);
    if (!isLookupKeyManuallyEdited) {
      setData('lookup_key', desiredLookup);
    }
    if (stripePrice.currency) {
      setData('currency', stripePrice.currency.toLowerCase());
    }
    if (typeof stripePrice.unit_amount === 'number' && stripePrice.unit_amount !== null) {
      setData('amount', Math.round(stripePrice.unit_amount));
    } else if (Array.isArray(stripePrice.tiers) && stripePrice.tiers.length > 0) {
      const mappedTiers: TierConfig[] = [];
      for (let i = 0; i < stripePrice.tiers.length; i++) {
        const t = stripePrice.tiers[i];
        const prevTo = i > 0 ? stripePrice.tiers[i - 1]?.up_to : 0;
        const from = typeof prevTo === 'number' ? prevTo + (i > 0 ? 1 : 0) : 0;
        const to = t.up_to ?? null;
        // Prefer flat_amount if provided (Stripe tier flat pricing), otherwise unit_amount
        const amount = (typeof t.flat_amount === 'number' && t.flat_amount !== null)
          ? t.flat_amount
          : ((typeof t.unit_amount === 'number' && t.unit_amount !== null) ? t.unit_amount : 0);
        mappedTiers.push({ from, to, unit_amount: amount });
      }
      setTiers(mappedTiers);
      setData('properties', { tiers: mappedTiers });
      if (stripePrice.tiers_mode === 'volume') {
        setData('type', 'volume');
      } else if (stripePrice.tiers_mode === 'graduated') {
        setData('type', 'graduated');
      } else {
        // Default to graduated for Stripe tiered billing when tiers_mode is unspecified
        setData('type', 'graduated');
      }
    }

    if (stripePrice.type === 'recurring' && stripePrice.recurring) {
      const interval = (stripePrice.recurring.interval || 'month') as RecurringInterval;
      setData('renew_interval', interval);
      setData('recurring_interval_count', stripePrice.recurring.interval_count || null);
      // Do not override complex pricing types derived from tiers
      if (!Array.isArray(stripePrice.tiers) || stripePrice.tiers.length === 0) {
        setData('type', 'recurring');
      }
    } else if (stripePrice.type === 'one_time') {
      setData('renew_interval', null);
      setData('recurring_interval_count', null);
      setData('type', 'one_time');
    }

    toast.success('Prefilled from Stripe price');
  };

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

    // Store cursor position for later adjustment

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
        // More direct approach:
        // After stripping commas from rawValue, the currentCursor effectively points to a position in a numbers-and-dot string.
        // We want to find that same relative position in the newDisplayValue, accounting for newly added/removed commas.
        let newCursor = currentCursor;
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

    // Validate parent list price selection for custom/variant prices
    if ((data.scope === 'custom' || data.scope === 'variant') && !data.parent_list_price_id) {
      toast.error(`Please select a base list price for this ${data.scope} price`, { id: toastId });
      return;
    }

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

    // Retain gateway linkage even when moving to custom/variant

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
            // if (!hideSuccessToast) {
            //   toast.success(`Price ${priceName} updated successfully`, { id: toastId });
            // }
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
    <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col flex-grow ">
      <DialogTitle className="bg-gray-100 text-base px-4 py-2">{isEditing ? 'Edit' : 'Add'} Price</DialogTitle>

    <DialogBody>
        <div className="flex-grow h-full overflow-auto p-4">
          <div className="flex flex-col gap-4 pb-4">
            {/* Stripe Price Search (prefill) - top of form */}
            {resolvedIntegrationId && resolvedGatewayProductId && (
              <div className="flex flex-col gap-2">
                <Label>Import from Stripe</Label>
                <Combobox
                  className="mt-1 w-full"
                  items={(stripePrices || []).map((price: StripePriceLite) => ({
                    value: price.id,
                    label: price.nickname || price.id,
                    subtitle: `${price.type}${price.recurring ? ` • ${price.recurring.interval}` : ''} • ${price.unit_amount ? formatMoney(price.unit_amount, price.currency) : ''}`,
                  }))}
                  placeholder={isLoadingStripePrices ? 'Loading prices…' : 'Search Stripe prices'}
                  selected={''}
                  onSelect={(value) => {
                    const id = typeof value === 'string' ? value : (value as string[])[0];
                    const found = (stripePrices || []).find((p: StripePriceLite) => p.id === id);
                    if (found) prefillFromStripePrice(found);
                  }}
                />
                <p className="text-xs text-muted-foreground">Selecting a Stripe price will prefill the fields below.</p>
              </div>
            )}

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

            <div className="flex flex-col gap-2">
              <Label htmlFor="scope">Price Type</Label>
              <Select
                name="scope"
                value={data.scope}
                onChange={(event) => setData('scope', event.target.value as PriceScope)}
                disabled={processing}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="">Select price type</option>
                <option value="list">List Price</option>
                <option value="custom">Custom Price</option>
                <option value="variant">Variant Price</option>
              </Select>
              {errors.scope && <p className="text-sm text-red-500">{errors.scope}</p>}
              <p className="text-xs text-muted-foreground">
                {data.scope === 'list' && 'Default publicly listed price'}
                {data.scope === 'custom' && 'One-off price for specific customers'}
                {data.scope === 'variant' && 'Variant of a list price'}
              </p>
            </div>

            {/* Move under different parent (and Parent selection for Custom/Variant) */}
            {(data.scope === 'custom' || data.scope === 'variant') && listPrices && listPrices.length > 0 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="parent_list_price_id">{isEditing ? 'Move under Parent List Price' : 'Base List Price'}</Label>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <Combobox
                      items={listPrices.map((price) => ({
                        value: price.id.toString(),
                        label: price.name || `Price #${price.id}`,
                        subtitle: `${price.type.replace('_', ' ')} • ${formatMoney(price.amount, price.currency)} ${price.currency.toUpperCase()}`,
                        metadata: (
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 h-auto">
                              {price.type.replace('_', ' ')}
                            </Badge>
                            {price.lookup_key && (
                              <span className="text-muted-foreground">Key: {price.lookup_key}</span>
                            )}
                            <span className={price.is_active ? "text-green-600" : "text-gray-500"}>
                              {price.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        ),
                        badge: (
                          <div className="flex flex-col items-end gap-1">
                            <Badge className="bg-green-600 text-white text-xs">
                              List
                            </Badge>
                            <span className="text-xs font-medium text-green-600">
                              {formatMoney(price.amount, price.currency)}
                            </span>
                          </div>
                        ),
                        disabled: !price.is_active,
                      }))}
                      selected={data.parent_list_price_id?.toString() || ''}
                      onSelect={(value) => {
                        const parentId = value ? parseInt(value as string) : null;
                        setData('parent_list_price_id', parentId);

                        // Automatically set the type to match the parent price
                        if (parentId && listPrices) {
                          const parentPrice = listPrices.find(p => p.id === parentId);
                          if (parentPrice) {
                            setData('type', parentPrice.type);
                            // Debug note shown next to model select when mismatched
                            if (data.type && data.type !== parentPrice.type) {
                              toast.message('Type adjusted to match parent', {
                                description: `Parent: ${parentPrice.type}, Child before: ${data.type}`
                              });
                            }
                          }
                        }
                      }}
                      placeholder="Search and select base list price"
                      disabled={processing}
                      className="w-full"
                      popoverClassName="min-w-[500px]"
                    />
                    {errors.parent_list_price_id && <p className="text-sm text-red-500">{errors.parent_list_price_id}</p>}
                    {data.parent_list_price_id && listPrices && (() => {
                      const parent = listPrices.find(p => p.id === data.parent_list_price_id);
                      if (!parent) return null;
                      const isMismatch = data.type !== parent.type;
                      if (!isMismatch) return null;
                      return (
                        <p className="text-xs text-orange-600">Debug: Selected parent is {parent.type}, form type is {data.type}. It will be aligned on save.</p>
                      );
                    })()}
                    <p className="text-xs text-muted-foreground">
                      {isEditing ? 'Move this price under another list price as a variant. Its pricing model must match the parent.' : 'This price will be based on the selected list price and inherit its pricing model.'} Search by name or type.
                    </p>
                  </div>
                  {/* Inline Stripe search below handles prefill; no separate dialog trigger needed */}
                </div>
              </div>
            )}

            {/* Warning if no list prices exist for custom/variant */}
            {(data.scope === 'custom' || data.scope === 'variant') && (!listPrices || listPrices.length === 0) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  No list prices found. You need to create a list price first before creating {data.scope} prices.
                </p>
              </div>
            )}

            {/* (Import block already shown at top) */}

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
                name="type"
                value={data.type}
                onChange={(event) => setData('type', event.target.value as PriceType)}
                disabled={isEditing || !!data.parent_list_price_id}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
              >
                <option value="">Select pricing model</option>
                <option value="one_time">One Time</option>
                <option value="recurring">Flat Rate (Recurring)</option>
                <option value="package">Package (Recurring)</option>
                <option value="tiered">Tiered (Recurring)</option>
                <option value="volume">Volume (Recurring)</option>
                {/*<option value="graduated">Graduated (Recurring)</option>*/}
              </Select>
              {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
              {data.parent_list_price_id && listPrices && (
                <p className="text-xs text-blue-600">
                  ℹ️ Pricing model inherited from base list price:
                  <span className="font-medium ml-1">
                    {listPrices.find(p => p.id === data.parent_list_price_id)?.type.replace('_', ' ') || data.type.replace('_', ' ')}
                  </span>
                </p>
              )}
            </div>

            {/* Amount + Currency Composite Input */}
            {['one_time', 'recurring'].includes(data.type) && (
              <div className="flex flex-col gap-2 w-full">
                <Label htmlFor="amount">Amount <span className="text-xs text-muted-foreground">(required)</span></Label>
                <div className={`flex w-full items-center rounded-md border border-input transition-colors ${
                  processing
                    ? 'bg-gray-50 opacity-50'
                    : 'bg-white focus-within:ring-2 focus-within:ring-ring/50 focus-within:border-ring'
                }`}>
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
                    disabled={processing || isEditing}
                    className={`border-0 focus:ring-0 focus:border-none rounded-none flex-1 min-w-0 px-2 text-base shadow-none ${
                      processing
                        ? '!bg-gray-100 !text-gray-600 cursor-not-allowed '
                        : 'bg-white'
                    } `}
                    style={{ boxShadow: 'none' }}
                    aria-describedby="amount-currency-addon"
                    placeholder="0.00"
                  />
                  {/* Currency Abbreviation Suffix with Dropdown */}
                  <Select
                    name="currency"
                    value={data.currency}
                    onChange={(event) => setData('currency', event.target.value.toLowerCase())}
                    disabled={processing || isEditing}
                    className={`
                    rounded-none border-0 bg-transparent px-3 h-9 min-w-[64px] w-auto text-base focus:ring-0 focus:border-none
                    ${processing || isEditing ? 'cursor-not-allowed !bg-gray-100 text-gray-500' : 'bg-white'}
                    `}
                  >
                    {getSupportedCurrencies().map((c) => {
                      const code = c.code.toLowerCase();
                      return (
                        <option key={code} value={code}>
                          {c.code} - {c.name}
                        </option>
                      )
                    })}
                  </Select>
                </div>
                {errors.amount && <p className="text-sm text-red-500">{errors.amount}</p>}
                {errors.currency && <p className="text-sm text-red-500">{errors.currency}</p>}
                {['tiered', 'graduated', 'package'].includes(data.type) ? (
                  <p className="text-xs text-blue-600">
                    💡 For complex pricing models, you can set a simple amount here OR configure the detailed pricing below.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Enter the price for this product.</p>
                )}
              </div>
            )}

            {/* Volume Pricing Notice */}
            {data.type === 'volume' && (
              <div className="flex flex-col gap-2 w-full">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="text-sm font-medium text-blue-800 mb-1">Volume Pricing</div>
                  <p className="text-xs text-blue-700">
                    Configure your volume pricing tiers below. The entire order will be charged at the tier price that matches the quantity.
                  </p>
                </div>
              </div>
            )}

            {/* Recurring Fields */}
            {['recurring', 'tiered', 'volume', 'graduated', 'package'].includes(data.type) && (
              <div className="bg-[#F7F9FF]">
                <div className="px-4 py-2 space-y-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setIsRecurringSettingsExpanded(!isRecurringSettingsExpanded)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">Recurring Settings</div>
                      <Badge variant="secondary" className="text-xs">
                        {data.renew_interval || 'month'} billing
                      </Badge>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      {isRecurringSettingsExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>

                  {isRecurringSettingsExpanded && (
                    <div className="space-y-4 pt-2">
                      <div className="flex flex-row gap-4 items-end">
                        <div className="flex flex-col gap-2 w-full">
                          <Label htmlFor="renew_interval">Billing Interval</Label>
                          <Select
                            name="renew_interval"
                            value={data.renew_interval || 'month'}
                            onChange={(event) => setData('renew_interval', event.target.value as RecurringInterval)}
                            disabled={processing || data.gateway_price_id !== null} // If price is already created in gateway, we can't change the interval
                            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50"
                          >
                            <option value="">Select interval</option>
                            <option value="day">Daily</option>
                            <option value="week">Weekly</option>
                            <option value="month">Monthly</option>
                            <option value="year">Yearly</option>
                          </Select>
                          {errors.renew_interval && <p className="text-sm text-red-500">{errors.renew_interval}</p>}
                          <p className="text-xs text-muted-foreground">How often customers will be billed</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="cancel_after_cycles">Cancel After (Optional)</Label>
                        <Input
                          id="cancel_after_cycles"
                          autoComplete="off"
                          type="number"
                          min="1"
                          step="1"
                          value={data.cancel_after_cycles || ''}
                          onChange={e => setData('cancel_after_cycles', e.target.value ? Number(e.target.value) : null)}
                          disabled={processing}
                          placeholder="e.g., 12 cycles"
                          className="bg-white"
                        />
                        {errors.cancel_after_cycles && <p className="text-sm text-red-500">{errors.cancel_after_cycles}</p>}
                        <p className="text-xs text-muted-foreground">
                          Automatically cancel subscription after this many billing cycles. Leave blank for indefinite billing.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tiered Pricing Fields */}
            {data.type === "tiered" && (
              <div className="bg-[#F7F9FF]">
                <div className="px-4 py-2 space-y-4">
                  <div>
                    <div className="text-sm font-medium">Tiered Pricing Configuration</div>
                    <p className="text-xs text-muted-foreground mt-1">Configure different prices based on quantity. Overrides the simple amount above.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {tiers.map((tier, index) => (
                      <div
                        key={index}
                        className="flex space-x-2 items-end rounded-md"
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
                </div>
              </div>
            )}

            {/* Package Pricing Fields */}
            {data.type === "package" && (
              <div className="bg-[#F7F9FF]">
                <div className="px-4 py-2 space-y-4">
                  <div>
                    <div className="text-sm font-medium">Package Pricing Configuration</div>
                    <p className="text-xs text-muted-foreground mt-1">Sell in fixed packages. Overrides the simple amount above.</p>
                  </div>
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
                </div>
              </div>
            )}

            {/* Volume Pricing Fields */}
            {data.type === "volume" && (
              <div className="bg-[#F7F9FF]">
                <div className="px-4 py-2 space-y-4">
                  <div>
                    <div className="text-sm font-medium">Volume Pricing Configuration</div>
                    <p className="text-xs text-muted-foreground mt-1">Set different prices for quantity ranges. Entire order uses the tier price. Overrides the simple amount above.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {tiers.map((tier, index) => (
                      <div
                        key={index}
                        className="flex space-x-2 items-end"
                      >
                        <div className="grid gap-1 flex-1">
                          <Label className="text-xs">Minimum Quantity</Label>
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
                          <Label className="text-xs">Maximum Quantity</Label>
                          <Input
                            autoComplete="off"
                            type="number"
                            min={tier.from + 1}
                            step="1"
                            value={tier.to === null ? '' : tier.to}
                            onChange={(e) => updateTier(index, 'to', e.target.value ? Number(e.target.value) : null)}
                            placeholder="∞"
                            disabled={processing}
                            className="h-8 bg-white"
                          />
                        </div>

                        <div className="grid gap-1 flex-1">
                          <Label className="text-xs">Price Per Unit (¢)</Label>
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
                      Add Volume Tier
                    </Button>

                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="text-xs font-medium text-blue-800 mb-1">Volume Pricing Example:</div>
                      <div className="text-xs text-blue-700">
                        If customer orders 25 units and tiers are: 1-10 ($5/unit), 11-50 ($4/unit),
                        then entire order is charged at $4/unit = $100 total.
                      </div>
                    </div>

                    {errors.properties && <p className="text-sm text-red-500">{errors.properties}</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Debug preview: mapped values before submit (for development) */}
            <div className="rounded-md bg-gray-50 p-3 text-xs text-gray-700">
              <button
                type="button"
                className="flex w-full items-center justify-between"
                onClick={() => setIsDebugOpen(!isDebugOpen)}
              >
                <div className="font-medium">Debug (mapped values)</div>
                {isDebugOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {isDebugOpen && (
                <>
                  <pre className="whitespace-pre-wrap break-all max-h-48 overflow-auto mt-2">
{JSON.stringify({
  resolvedIntegrationId,
  resolvedGatewayProductId,
  mapped: {
    scope: data.scope,
    type: data.type,
    currency: data.currency,
    amount: data.amount,
    renew_interval: data.renew_interval,
    recurring_interval_count: data.recurring_interval_count,
    properties: data.properties,
    gateway_provider: data.gateway_provider,
    gateway_price_id: data.gateway_price_id,
  }
}, null, 2)}
                  </pre>
                  <div className="mt-1 text-[10px] text-muted-foreground">Note: Stripe types map to our ChargeType enum: one_time, recurring, graduated, volume, package.</div>
                </>
              )}
            </div>

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

          </div>
        </div>

    </DialogBody>

    <DialogActions className="bg-gray-100 p-4 flex justify-between gap-2">

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
      <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={processing}
      >
        Cancel
      </Button>
    </DialogActions>
  </form>
  );

  if (hideDialog) {
    return content;
  }

  return (
    <Dialog open={open} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="p-0">
        {content}
      </DialogContent>
    </Dialog>
  );
}
