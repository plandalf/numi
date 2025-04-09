# Payments

Payments occur via a payments provider (like Stripe)

payment providers need to be connected 

some payment providers use things like prices

checkout commit -> try to process order items

update order item statuses 

prices need links (twins)

## Payment Model


# Order Processing

Iterating over the order items, each needs to be handled uniquely. 

examples:

### Checkout with 1 line item

- single line item for a Price thats type=`one_time` 
- order attempts to create a charge on the customer for the calculated amount
- order stores the payment_id on the order_item 
- order status = success

## Checkout with 2 line items

- two items for 2 different prices that 1 is type=`one_time` and 1 is `volume`
- order attempts to create 1 payment for the aggregated amount of both items 
- order stores the payment_id on both order_items
- order status = success


## Checkout payment failure

- two items for 1 Price
- order attempts to create 1 payment
- order status = `failing` until user retries, checkout wont be completed 

## Checkout with subscription type

- one item for 1 subscription Price
- order attempts to create 1 subscription in stripe
- upon success, we associate the subscription_id to the order_item

## Checkout with 1 subscription item and one regular item

- one item for 1 subscription Price
- order attempts to create 1 subscription in stripe
- upon success, we associate the subscription_id to the 1st order_item
- order attempts to create a charge on the customer for the calculated amount of the regular item
- order stores the payment_id on the 2nd order_item

## Creating a payment stripe args
amount: payment.amount_cents,
currency: payment.amount_currency.downcase,
customer: provider_customer.provider_customer_id,
payment_method_types: provider_customer.provider_payment_methods,
confirm: true,
off_session: off_session?,
return_url: success_redirect_url,
error_on_requires_action: error_on_requires_action?,
description: reference,
metadata: enriched_metadata


# Payment model
saving on the `order`
payment.provider_payment_id = stripe_result.id
payment.status = stripe_result.status
payment.payable_payment_status = payment.payment_provider&.determine_payment_status(payment.status)
payment.provider_payment_data = stripe_result.next_action if stripe_result.status == "requires_action"
payment.save!
