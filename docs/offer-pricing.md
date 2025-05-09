
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

-- required prices
line_items[primary][price]    = {{PRICE_ID}} 
line_items[primary][quantity] = 1 
line_items[primary][required] = true 
  
-- optional prices
dont exist in the checkout specifically, but can be added in or referenced by their key 
line_items[addon-1][price]     = {{PRICE_ID}} 
line_items[addon-1][quantity]  = 1 
line_items[addon-2][price]     = {{PRICE_ID}} 
line_items[addon-2][quantity]  = 1


# Initializing Checkouts

When a checkout is started, it takes the line_items template from the Offer like above and makes it real. 

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

1 item, named `book`, quantity 1, price = "book-price"


## selling a book and an optional pencil

1 item named `book`,     quantity 1, price = {{book_price}}, REQUIRED
1 item named `accessory` quantity 1, price = {{pencil}},     OPTIONAL

User selects [] Pencil addon checkbox 
`checkout.setItem('accessory', required=true)` 

To unselect
`checkout.setItem('accessory', required=false)` 


## Selling the option to buy 1 book or 4 books

1 item named `book`, quantity 1, price = {{book_price}}, REQUIRED

Checkout has a radio-list block with two options:
- Label: "Buy 1 Book",  value: "1-book"
- Label: "Buy 4 Books", value: "4-books"

Radio block has a field for `initialValue` equal to "1-book"

User clicks "Buy 4 books"
`checkout.setItems('book', quantity=4)`

User clicks "Buy 1 book"
`checkout.setItems('book', quantity=1)`


## Selling the option to buy black book or red book

1 item named `book`, quantity 1, price = {{black_book_price}}, REQUIRED

Checkout has a radio-list block with two choices:
- Label: "Buy Black Book", value: "black-book"
- Label: "Buy Red Book",   value: "red-book"

User 

User clicks "Buy Red Book"
`checkout.setItems('book', price={{red_book_price}})`

User clicks "Buy Black Book"
`checkout.setItems('book', price={{black_book_price}})`


##  Selling either a red or black book OR a subscription to a green book, and an optional pencil subscription

1 item named `book`,      quantity 1, price = {{red_book_price}},     REQUIRED
1 item named `accessory`, quantity 1, price = {{green_pencil_price}}, OPTIONAL

Checkout has a radio-list block with two choices:
- Label: "Buy Red Book",   value: "red-book"
- Label: "Buy Black Book", value: "black-book"

Checkout has a checkbox 
- Label: "Green book payment plan", value: "want_green"

Checkout has ANOTHER checkbox
- Label: "Subscription to pencil", value: "want_pencil"

User clicks "Buy Black Book"
`checkout.setItems('book', price={{black_book_price}})`

User Checks "Green book payment plan"
`checkout.setItems('book', price={{green_book_price}})`

User Selects "Buy Red Book"
`checkout.setItems('book', price={{red_book_price}})`

User Selects "Subscription to pencil"
`checkout.setItems('accessory', required=true)`

User checks out
1 payment for $red_book_price 
1 subscription created for {{green_pencil_price}}
