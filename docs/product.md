# numi 

# Numi - Product Specification

Numi is a flexible checkout builder designed to empower businesses like MidWesternLiving, WeddingAlbum, and EventAlbum to create customized purchase experiences for their customers, aiming to be significantly more intuitive and powerful than existing solutions.

**Status Update (Apr 2024):** 
*   Core `Product` and `Price` management implemented (models, controllers, UI dialogs).
*   Core `Offer` configuration management implemented (`Offer` model, `OffersController`, basic UI likely exists).
*   `OfferVariant` model exists, acting as a pricing/option layer *specific to an Offer*, currently separate from the main `Product`/`Price` catalog. Integration/rationalization TBD.
*   Checkout Session management is the next focus.

## Core Concepts (Refined Terminology & Structure - Reflecting Current Code)

*   **Organization:** The top-level entity grouping users, products, offers, etc. (Implicitly managed via middleware and user context). All data is scoped by `organization_id`.
*   **Product:** (`App\Models\Product`) Represents a fundamental sellable item or service (e.g., "Magazine Ad", "Workshop Seat", "Base Subscription"). Linked to an `organization_id`.
    *   `name`: User-facing name.
    *   `lookup_key`: Unique identifier within the organization.
    *   `gateway_provider` / `gateway_product_id` (nullable): For linking to external payment gateway products.
    *   `type` (Conceptual - *Not Yet Implemented*): Future field to categorize the product (e.g., `standard`, `scheduled`, `subscription`, `credits`).
*   **Price:** (`App\Models\Price`) Defines the cost and billing structure for a specific `Product` (or ideally, a future `Variant`). Currently linked directly to `product_id` and `organization_id`.
    *   **`scope`**: `'list'` (standard price) or `'custom'` (override for specific contexts - selection mechanism TBD).
    *   **`parent_list_price_id`**: (nullable FK on `prices`) If `scope = 'custom'`, links to the base `'list'` price.
    *   **`pricing_model`**: `'one_time'`, `'recurring'`, `'package'`, `'tiered'` (as implemented in `PriceForm.tsx`). `'volume'`, `'graduated'` are potential future additions.
    *   **`amount`**: Base price in cents (used for `one_time`, `recurring`). Ignored for models where price is derived from `properties`.
    *   **`currency`**: 3-letter ISO code.
    *   **Recurring Settings:** `recurring_interval`, `recurring_interval_count`, `cancel_after_cycles` (nullable).
    *   **`properties`**: JSON field storing configuration for complex models:
        *   For `'tiered'`: `{ tiers: [{ from: number, to: number | null, unit_amount: number }, ...] }`
        *   For `'package'`: `{ package: { size: number, unit_amount: number } }`
    *   `gateway_provider` / `gateway_price_id` (nullable): For linking to external gateway prices.
    *   `is_active` (boolean): Controls if the price can be used.
    *   `archived_at` / `deleted_at` (soft deletes): For managing price history.
*   **Offer:** (`App\Models\Store\Offer`) Represents a persistent, reusable configuration for a specific sales presentation or checkout flow. Defines design, payment settings, and has many **Slots**.
    *   `name`, `description`, `status`, `default_currency`, `organization_id`.
    *   `design_config` (JSON): Likely for UI customization settings.
    *   `payment_config` (JSON): For Offer-level payment gateway settings.
    *   `properties` (JSON): For additional Offer-level settings.
    *   `product_image_id`: Link to a primary image for the offer.
    *   Relationship: `HasMany` -> `Slot`
*   **Slot:** (`App\Models\Store\Slot`) Defines a position within an `Offer` that holds a specific **default Price**. Actions can potentially change the `Price` in a Slot during checkout. The specific `Price` selected for a slot during purchase will be recorded on the `OrderItem`.
    *   Linked to `Offer` (`offer_id`).
    *   Linked to a default `Price` (`default_price_id`) (nullable).
    *   Fields: `key` (string, unique per offer, e.g., "main_product", "0", "upsell"), `name` (string), `is_required` (boolean), `sort_order`.
    *   Relationship: `BelongsTo` -> `Offer`
    *   Relationship: `BelongsTo` -> `Price` (for default price)
*   **Variant (Catalog):** (Concept - *Not Yet Implemented*) Aspirational layer between `Product` and `Price` in the main catalog.
*   **Checkout Session:** (Concept - *Implementation Starting*) Represents an ephemeral, in-progress attempt by a customer to make a purchase...
    *   The `session_data` will now contain selected items like `{ slot_key: price_id, quantity: 1 }`.
*   **Custom Field:** (Concept - *Not Yet Implemented*)
*   **Order / OrderItem / Payment / Subscription / Credits:** (Core concepts for completed transactions - *Not Yet Implemented*).

## Implemented Features (Summary)

*   **Product Catalog:**
    *   Backend: `Product`, `Price` models, migrations, controllers (`ProductController`, `PriceController`), actions, form requests.
    *   Frontend: `Products/Index`, `Products/Show` pages; `ProductForm`, `PriceForm` dialog components.
*   **Offer Configuration:**
    *   Backend: `Offer`, `OfferVariant` models (`App\Models\Store\\`), `OffersController`. Offer now includes `slots_config`. `OfferVariant` links to `Price`.
    *   Frontend: Offer management UI likely exists (e.g., for `/offers/{offer}/edit`, `/offers/{offer}/pricing`). `VariantForm.tsx` dialog likely needs refactoring to manage linking `OfferVariant` to a `Price` instead of defining price details.

## Flexible Pricing & Billing Models (Supported by Current Models)

*   **`Price` Model (Catalog):** Supports `one_time`, `recurring`, `package`, `tiered`, `custom` scope via `PriceForm`. This is the central place for pricing definitions.
*   **`OfferVariant` Model (Offer-Specific Link):** Links an `Offer` to a specific catalog `Price`.

**NOTE:** Checkout processing logic using the new Slot/OfferVariant structure is **NOT YET IMPLEMENTED**.

## Managing Price Updates (Current Implementation)

*   Catalog `Price` records can be edited/soft-deleted via `PriceForm`. Changes to a `Price` will reflect everywhere it's linked (e.g., in `OfferVariants` or default Slot prices).
*   `OfferVariant` records can be edited/deleted via the Offer context. Editing likely involves changing which `Price` it links to.
*   Gateway price archiving/replacement is **NOT YET IMPLEMENTED**.

## Outstanding Concepts & Future Work (High Level)

*   **Implement Catalog Variants:** Introduce `variants` table between `Product` and `Price`.
*   **Implement Offer Slots Logic:** Build UI and backend logic for managing `Slot` records linked to an `Offer` and using them in checkout.
*   **Implement Checkout Sessions:** Design flow, storage, and API incorporating Slots.
*   **Implement Orders & Fulfillment:** ...
*   **Gateway Integration:** ...
*   **Implement Product Types:** ...
*   **Implement Custom Fields:** ...
*   **Implement Credit System:** ...
*   **Implement Workflows:** ...

---

# Checkout

checkout initiated vs checkout completed rate 