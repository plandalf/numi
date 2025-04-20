
# Checkout

CheckoutSession has many CheckoutLineItems identified by their slot_key
CheckoutSession has a public ID which is a base64 encoded ordered UUID 
When CheckoutSessions are created, we generate a signature to be set in the URL to remember the user as `checkout_token={SIGNATURE}` with 1 week expiry
Public CheckoutSession url is /c/{ID}?checkout_token={}
On completion by default CheckoutSession is redirected to order status page

checkout Slots identifiers
