# Offers

Offers store the template for checkouts 

## Items

Offer items should be identified with a "slot" ID 

SetPriceInSlot('slot-1', 'price-id', 1)

checkouts can have identified "slots" 
instead of replacing the entire items we just swap into slots
set slots as required or not

example:
MWL
- 1 item (full page ad) in slot-1
- user clicks "4 issues"
- swap slot-1 with price 'full-page-ad-4'
- radio button has an attribute like active={{ slots['slot-1'].price === 'full-page-ad-4' }}
- user activates 'subscribe and save' switch 
- swap slot-1 with price 'full-page-ad-subscription-4'
- user de-activates 'subscribe and save' 
- swap slot-1 with price 'full-page-ad-4' again 
- user activates "listing addon"
- add items to slot-2
- reverse to remove from slot-2

