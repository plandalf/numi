# Items in Offers

Offers are just the "prototype" or "template" for a Checkout.
When checking out, the "Checkout" stores the state as a list of `line_items` 

## How Items work in offers

Items have attributes:
- name (identifier)
- price (Price)
- quantity (number)
- required (true/false) 
  
line_items[<NAME>][<ATTRIBUTE>] = <VALUE>

**Note on `{{PRICE_ID}}`**: The `price` attribute of a line item stores a `{{PRICE_ID}}`. This ID can point to different types of prices, such as a one-time purchase price or a recurring subscription price. The system managing these Price IDs will handle the distinction.

### required prices

```
line_items[primary][price]    = {{PRICE_ID}} 
line_items[primary][quantity] = 1 
line_items[primary][required] = true 
```
  
### optional prices

All items, including those considered "optional" for the end-user, are defined in the Offer and thus initialized in the 
Checkout's `line_items`. Optional items have `required: false`.

```
line_items[addon-1][price]     = {{PRICE_ID}} 
line_items[addon-1][quantity]  = 1 
line_items[addon-1][required]  = false
  
line_items[addon-2][price]     = {{PRICE_ID}} 
line_items[addon-2][quantity]  = 1
line_items[addon-2][required]  = false
```


# Initializing Checkouts

When a checkout is started, it takes the `line_items` template from the Offer (as defined above) and instantiates it. All items from the offer, including those intended to be optional choices for the user, are part of this initial checkout state, with optional items typically having `required: false`.

# Checkout Builder UI Considerations

The "checkout builder" is the interface where an administrator or marketer configures an Offer. They will define the set of available items and their default properties. This configuration forms the data template for new checkouts.

*   **Offer Item Configuration:** Defines a single potential item within the offer.
    *   `Item Name (ID)`: e.g., `book`, `accessory`. This is the unique identifier used when calling `checkout.setItem(ID, ...)`.
    *   `Default Price ID`: The initial `{{PRICE_ID}}` for this item when the checkout is first created.
    *   `Default Quantity`: The initial quantity for this item.
    *   `Initially Required`: Boolean.
        *   If `true`, this item starts with `required: true` in the checkout's `line_items`.
        *   If `false`, this item starts with `required: false`. Typically, such an item would be presented as an optional add-on in the UI, and a user interaction (e.g., checking a box) would trigger `checkout.setItem(ID, {required: true})`.

# Designing UI Interactions with `setItem()`

The `checkout.setItem(ID, {OPTIONS})` function is the sole mechanism for dynamically altering the checkout state based on user interaction. Frontend designers and developers should use standard UI components (buttons, checkboxes, radio groups, quantity inputs, etc.) and attach event listeners to them. These listeners will then call `checkout.setItem()` with the appropriate parameters.

**Key Principles for Designers:**

*   **UI Components as Triggers:** Your UI elements (e.g., a radio button selection, a checkbox tick, a quantity stepper click) are the triggers.
*   **Event Handlers Call `setItem()`:** When a user interacts with a trigger, the corresponding UI event handler is responsible for constructing and executing the `checkout.setItem()` call.
*   **`ID` Parameter:** The `ID` in `checkout.setItem(ID, ...)` must match the `Item Name (ID)` of an `Offer Item Configuration`.
*   **`OPTIONS` Parameter:** This object specifies what attributes of the identified line item to change.
    *   `price`: To change the `{{PRICE_ID}}` of the line item.
    *   `quantity`: To change the quantity of the line item.
    *   `required`: To change the `required` status (Boolean) of the line item (e.g., for selecting/deselecting an optional add-on).

The backend `Offer Item Configuration` defines *what* is available and its defaults. The frontend UI design determines *how* the user interacts to modify these items via `setItem()`.

# Functions

## setItems() 

`checkout.setItems(ID, {OPTIONS})`

The only **function** we need to make the whole thing work 

setItem has 2 attributes (arguments):
- ID      : which tells the checkout which line_item we're referencing
- OPTIONS : a list of options telling the checkout what to change

Options:
- price
- quantity
- required 


# Use cases

## selling a book

### Offer Setup (Data Configuration)
*   Define one "Offer Item":
    *   `Item Name (ID)`: `book`
    *   `Price ID`: `{{book_price}}`
    *   `Quantity`: `1`
    *   `Initially Required`: True

### Initial Checkout State
```
line_items[book][price]    = {{book_price}}
line_items[book][quantity] = 1
line_items[book][required] = true
```

### End-User Checkout UI & Interactions (Design Focus)
The user sees the book listed. In this simple scenario, there are typically no UI elements to change this item.


## selling a book and an optional pencil

### Offer Setup (Data Configuration)
1.  "Offer Item" for the book:
    *   `Item Name (ID)`: `book`
    *   `Price ID`: `{{book_price}}`
    *   `Quantity`: `1`
    *   `Initially Required`: False

### Initial Checkout State
```
line_items[book][price]      = {{book_price}}
line_items[book][quantity]   = 1
line_items[book][required]   = true
line_items[accessory][price]    = {{pencil_price}}
line_items[accessory][quantity] = 1
line_items[accessory][required] = false
```

### End-User Checkout UI & Interactions (Design Focus)
*   The book is listed as a primary item.
*   A UI checkbox (or similar toggle) is displayed, e.g., labeled "Add Pencil ({{pencil_price_formatted}})".
    *   When user checks it, the UI triggers: `checkout.setItem('accessory', {required: true})`
    *   When user unchecks it, the UI triggers: `checkout.setItem('accessory', {required: false})`


## Selling the option to buy 1 book or 4 books

### Offer Setup (Data Configuration)
1.  "Offer Item" for the book:
    *   `Item Name (ID)`: `book`
    *   `Price ID`: `{{book_price}}`
    *   `Quantity`: `1`
    *   `Initially Required`: True

### Initial Checkout State
```
line_items[book][price]    = {{book_price}}
line_items[book][quantity] = 1
line_items[book][required] = true
```

### End-User Checkout UI & Interactions (Design Focus)
*   A UI radio button group is displayed:
    *   Option 1: Label "Buy 1 Book"
    *   Option 2: Label "Buy 4 Books"
*   The radio group is initialized to select "Buy 1 Book" based on the `Quantity` of the `book` item.
*   When user selects "Buy 4 Books", the UI triggers: `checkout.setItem('book', {quantity: 4})`
    *   The displayed price for the book item should dynamically update based on this change.
*   When user selects "Buy 1 Book", the UI triggers: `checkout.setItem('book', {quantity: 1})`


## Selling the option to buy black book or red book

### Offer Setup (Data Configuration)
1.  "Offer Item" for the book:
    *   `Item Name (ID)`: `book`
    *   `Price ID`: `{{black_book_price}}` (This sets the initial selection)
    *   `Quantity`: `1`
    *   `Initially Required`: True

### Initial Checkout State
```
line_items[book][price]    = {{black_book_price}}
line_items[book][quantity] = 1
line_items[book][required] = true
```

### End-User Checkout UI & Interactions (Design Focus)
*   A UI radio button group is displayed:
    *   Option 1: Label "Buy Black Book ({{black_book_price_formatted}})"
    *   Option 2: Label "Buy Red Book ({{red_book_price_formatted}})"
*   The radio group is initialized to select "Buy Black Book" based on the `Default Price ID`.
*   When user selects "Buy Red Book", the UI triggers: `checkout.setItem('book', {price: '{{red_book_price}}'})`
*   When user selects "Buy Black Book", the UI triggers: `checkout.setItem('book', {price: '{{black_book_price}}'})`


## Selling EITHER (a red or black book) OR (a green book subscription), AND an optional pencil subscription

This use case highlights how one primary choice can change the core product, and an independent choice can add an accessory. The complexity lies in the Green Book Subscription option being conditional on the Black Book selection.

### Offer Setup (Data Configuration)
1.  "Offer Item" for the main publication:
    *   `Item Name (ID)`: `main_offering`
    *   `Price ID`: `{{red_book_price}}` (Initial default)
    *   `Quantity`: `1`
    *   `Initially Required`: `true`
2.  "Offer Item" for the optional pencil subscription:
    *   `Item Name (ID)`: `pencil_addon`
    *   `Price ID`: `{{green_pencil_subscription_price}}`
    *   `Quantity`: `1`
    *   `Initially Required`: `false`

### Initial Checkout State
```
line_items[main_offering][price] = {{red_book_price}}
line_items[main_offering][quantity] = 1
line_items[main_offering][required] = true
line_items[pencil_addon][price] = {{green_pencil_subscription_price}}
line_items[pencil_addon][quantity] = 1
line_items[pencil_addon][required] = false
```

### End-User Checkout UI & Interactions (Design Focus)

1.  **Book Selection (Radio Group):**
    *   Controls the base `price` of the `main_offering` item.
    *   Options:
        *   "Red Book" (Formatted price e.g., `{{red_book_price_formatted}}`)
        *   "Black Book" (Formatted price e.g., `{{black_book_price_formatted}}`)
    *   *Initial UI State*: "Red Book" is selected.

2.  **Green Book Subscription Upgrade (Checkbox):**
    *   Label: "Switch to Green Book Subscription" (Formatted price e.g., `{{green_book_subscription_price_formatted_per_interval}}`)
    *   *UI Visibility*: This checkbox is ONLY visible if the "Black Book" radio option is currently selected.
    *   *Initial UI State*: Hidden (because "Red Book" is initially selected). If "Black Book" radio becomes selected, this checkbox appears and is initially unchecked.

3.  **Pencil Add-on (Checkbox):**
    *   Label: "Add Pencil Subscription" (Formatted price e.g., `{{green_pencil_subscription_price_formatted_per_interval}}`)
    *   *Initial UI State*: Unchecked. This is independent of the book choices.

**User Interactions & `setItems` Calls (Triggered by UI Event Handlers):**

*   **User selects "Red Book" radio option:**
    *   `checkout.setItem('main_offering', {price: '{{red_book_price}}'})`
    *   *UI Update Effects*:
        *   "Red Book" radio is selected.
        *   "Green Book Subscription" checkbox becomes hidden (its checked state is effectively reset/irrelevant).

*   **User selects "Black Book" radio option:**
    *   `checkout.setItem('main_offering', {price: '{{black_book_price}}'})`
    *   *UI Update Effects*:
        *   "Black Book" radio is selected.
        *   "Green Book Subscription" checkbox becomes visible.

*   **User checks the "Green Book Subscription" checkbox:**
    *   (This action is only possible if the "Green Book Subscription" checkbox is visible, meaning "Black Book" radio is selected).
    *   `checkout.setItem('main_offering', {price: '{{green_book_subscription_price}}'})`
    *   *UI Update Effects*:
        *   "Green Book Subscription" checkbox is checked.
        *   "Black Book" radio remains selected (due to green checkbox visibility being dependent on it).

*   **User unchecks the "Green Book Subscription" checkbox:**
    *   (This action implies it was previously checked, and "Black Book" radio is selected).
    *   `checkout.setItem('main_offering', {price: '{{black_book_price}}'})`
    *   *UI Update Effects*:
        *   "Green Book Subscription" checkbox is unchecked.
        *   "Black Book" radio remains selected.

*   **User checks the "Add Pencil Subscription" checkbox:**
    *   `checkout.setItem('pencil_addon', {required: true})`

*   **User unchecks the "Add Pencil Subscription" checkbox:**
    *   `checkout.setItem('pencil_addon', {required: false})`

### Checkout Outcome Example
If user selects "Red Book" and checks "Add Pencil Subscription":
*   One-time payment initiated for `{{red_book_price}}`.
*   A new subscription is created for `{{green_pencil_subscription_price}}`.
The checkout summary should clearly reflect one item as a one-time purchase and the other as a recurring subscription.
