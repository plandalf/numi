
# Order

Order is created from a CheckoutSession's -> CheckoutItem(s)

CheckoutSession is created from an Offer with its configured prices in slots

CheckoutSession from Offer can be customised at runtime with custom slot inputs

Items always relate to a Price

Price has a "type" -> one_time|graduated|standard|volume|package

If Price has renew_interval, its subscription 

If Price has cancel_after_cycles, renewals are capped

Order will immediately process all checkout items into order items and set Checkout to "closed".

Orders will have their own (basic) public order status page with information about purchase status

Status page URL /order-status/{public-id}?signature={url-signature}

Orders are listed in dashboard

Orders have a default redirect behaviour if none is used to the order status page