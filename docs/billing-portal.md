## Billing Portal

The Billing Portal lets you view and manage your subscription, update payment details, download invoices, and pay open invoices in a secure, self‑service experience.

### How to access

- From your account’s Billing page, click “Manage billing.” This opens the portal in a new tab or within a popup.
- If you received a direct link from support, just open it. You may see a “Return to site” button to go back when you’re done.

### What you can do

- Subscription
  - See your current plan, status (active, trial, canceled), and renewal date
  - View trial end date and whether cancellation at period end is set
- Payment methods
  - Add a new card and set a default card for future payments
  - Update or remove saved cards (some options may be disabled if required for billing)
- Invoices
  - Download PDF receipts and view hosted invoice pages
  - Pay open invoices securely
- Change plan
  - Switch to another available plan; prorations may apply
- History and orders
  - Review past subscriptions and payments
  - View your orders and receipts

### Security and privacy

- The portal uses a secure, time‑limited access link. Opening the link allows you to manage only your own billing details.
- Payment details are handled by our payment provider over an encrypted connection.
- If the link expires or you can’t access the portal, request a fresh “Manage billing” link from within your account or contact support.

### Troubleshooting

- I can’t open the portal: Ensure you’re signed in to your account and try again. If it still fails, request a new link.
- My payment failed: Update your default payment method and retry paying the invoice from the Invoices tab.
- I don’t see an invoice: It can take a minute to appear after payment. Refresh the page, then check again.
- I need to change my email or billing address: Update it in your account profile. If you need changes on an issued invoice, reach out to support.

### FAQs

- How do I cancel my subscription?
  - Use the Subscription tab to cancel at period end. If you need immediate cancellation, contact support.
- Can I get a refund?
  - Refunds follow our refund policy. Contact support and include your invoice number.
- How do I change plans?
  - Open the Change plan section, select a plan, and confirm. Any price changes will be shown before you confirm.

## For developers: embedding the portal with the v1.js script

Add a script to your app and place a button (or any element) with data‑attributes. Clicking it opens the secure billing portal in a popup.

1) Include the script

```html
<script src="https://your-plandalf-host/js/v1.js" async></script>
```

2) Add a trigger element

```html
<button
  data-numi-embed-type="billing-portal"
  data-numi-customer="<JWT>"
  data-numi-return-url="https://app.example.com/account">
  Manage billing
</button>
```

```html
<button
  data-plandalf-embed="billing-portal"
  data-customer="<JWT>"
  data-return-url="https://app.example.com/account">
  Manage billing
</button>
```


Accepted attributes:

- data-numi-embed-type="billing-portal" (or use `data-numi-billing-portal` or `data-numi-portal="billing"`)
- data-numi-customer or data-numi-customer-token: the signed JWT for the Stripe customer
- data-numi-return-url: optional URL to return users to when they close the portal
- data-numi-button-text, data-numi-button-color, data-numi-button-size: optional UI tweaks for the auto-generated button
- data-numi-domain: override the portal host if you serve `v1.js` from a different domain (e.g. `app.plandalf.dev` or `localhost:8002`)

Notes:

- The element acts as the trigger; the portal opens in a popup overlay.
- If you need to debug, set `window.PLANDALF_DEBUG = true` before the script loads or append `?PLANDALF_DEBUG=1` to the page URL.
