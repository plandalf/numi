Implementing a Multi-Mode, Multi-Method Checkout Workflow with Stripe

Key goals 
- Allowing users to toggle between one-time payments and subscriptions for a product within the checkout flow, dynamically updating the line items.w
- Supporting multi-page, non-linear navigation (e.g. collecting email on one page, payment on another, with possible branching based on choices).
- Supporting multiple countries and payment methods – the checkout must intelligently present payment options that are available given the merchant’s enabled methods, the customer’s region, the currency, and whether the purchase is one-time or recurring.
- Letting customers switch payment methods at checkout (e.g. choose card, then switch to Klarna, etc.) and handle redirect-based methods (like Klarna or iDEAL) gracefully.
- Collecting customer email addresses (for receipts, customer identification, and reusing saved payment methods).
- Embedding the checkout on client sites or hosting it on your domain, as needed.
- Handling mixed carts (e.g. one-time item plus a subscription in the same checkout) and ensuring each item is provisioned properly (charging the one-time amount and creating the subscription in Stripe, etc.).

CheckoutSession (Checkout) model
CREATE TABLE `checkout_sessions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organization_id` bigint unsigned NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  `payment_method_id` bigint DEFAULT NULL,
  `offer_id` bigint unsigned DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `properties` json DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `finalized_at` timestamp NULL DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `client_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `return_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_confirmed_at` timestamp NULL DEFAULT NULL,
  `payment_method_locked` tinyint(1) NOT NULL DEFAULT '0',
  `discounts` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `test_mode` tinyint(1) NOT NULL DEFAULT '0',
  `intent_type` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `intent_id` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `checkout_sessions_uuid_unique` (`uuid`),
  KEY `checkout_sessions_organization_id_foreign` (`organization_id`),
  KEY `checkout_sessions_offer_id_foreign` (`offer_id`),
  CONSTRAINT `checkout_sessions_offer_id_foreign` FOREIGN KEY (`offer_id`) REFERENCES `store_offers` (`id`),
  CONSTRAINT `checkout_sessions_organization_id_foreign` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

Designing the Checkout Workflow
1. Managing Checkout State and Customer Info (Multi-Page Flow)
   Because your checkout is multi-page (e.g. an email page, a payment page, etc.), you should maintain a Checkout Session state in your system. When a customer begins a checkout:
   Create a Checkout record in your database to track the cart items, chosen mode (one-time vs subscription), customer email, and any other arbitrary fields collected. Assign it a unique ID or token. This will let you resume the checkout if the user returns later and prevent duplicate processing.
   On the email collection page, store the email in this Checkout record. (If the email corresponds to an existing customer of the tenant/merchant, you could later attach the Stripe Customer for payment – more on this below.)
   If the user navigates away and later returns via the Checkout ID, check if the checkout is already completed. If yes, redirect them to an order confirmation/status page instead of restarting payment. If not, restore their progress (e.g. prefill email, retain cart items).

2. Switching Between One-Time Purchase and Subscription
   For products that can be either bought outright or subscribed to, your UI should allow toggling and update the pricing line items accordingly. Key points in the workflow:
   Dynamic Line Items: When the user switches mode, update the Checkout state with the new line items. For example, switching to “subscription” might replace a one-time price item with a recurring price item. This can happen client-side (in React) and be saved to your backend when the user proceeds.
   Deferred Payment Intent Creation: Do not create or confirm any Stripe payment intent yet during toggling. It’s best to wait until the user finalizes their choice and is ready to pay, to avoid creating incorrect PaymentIntents or Subscriptions that you might have to cancel if the user switches modes. We will create the necessary Stripe intents at the payment step (just-in-time creation on form submission).
   Mixed Cart (One-time + Subscription): If your checkout allows both a one-time item and a subscription in the same transaction, plan to handle this as a single combined checkout. Stripe’s APIs don’t support a single PaymentIntent directly covering both a one-time charge and a subscription after the initial payment. However, you can charge them together by leveraging Stripe Invoices. The recommended approach is to create a Subscription for the customer that includes the recurring item and an additional one-time invoice item for the purchase. Stripe allows adding one-time prices to the first invoice of a subscription via the add_invoice_items parameter
   stackoverflow.com
   . This means the customer will be charged once for the total of the one-time product + the first subscription period, and the subscription will be set up for subsequent renewals:
   Example: If the cart has a $100 one-time product and a $20/month subscription, you would create a Stripe Subscription with the $20/month price and add a one-time $100 price as an invoice item. The initial invoice will total $120 in a single charge, after which the subscription continues at $20/month. This avoids scenarios where a one-time charge succeeds but the subscription creation fails (or vice versa) – it’s all one combined payment
   
3. Back-End: Handling Payment Intents and Subscriptions
   When the customer submits the payment form (on the final step of your checkout): A. Determine the Checkout Mode: Inspect the Checkout record to see if it contains any subscription items. There are two scenarios:
   Payment (One-time purchases only): No recurring items in cart.
   Subscription (Contains at least one recurring item): This could also include one-time items in the initial invoice, as discussed.
   B. Create Stripe Customer (if needed): You mentioned preferring not to create a Customer up front. It’s fine to defer this, but at the moment of payment we likely do need a Stripe Customer:
   For one-time payments, a Customer is optional; you can charge a PaymentIntent without a customer, but creating one is beneficial if you want to save payment details or allow return customers to reuse cards.
   For subscriptions, a Stripe Customer is required (Stripe subscriptions always belong to a Customer). So if the user is in “subscription” mode and you haven’t created a customer yet, create one now (using the collected email, name, etc.). If your system already has a Stripe Customer ID (e.g. the tenant passed an existing customer or you found one by email), use that. Otherwise, create a new customer via the Stripe API.
   C. Create the Stripe Intent(s): Depending on the mode, you will create one of the following on your backend (Laravel) and send its details (like a client secret) to the frontend for confirmation:
   One-time Payment: Create a PaymentIntent for the total amount of the cart. Include amount, currency, and allowed payment_method_types. Enable automatic_payment_methods if you want Stripe to automatically offer all available methods, or explicitly set the types based on your logic. You do not need to confirm it server-side; just create it with status=requires_confirmation. Do not attach a payment method yet. If you created a Customer and want to save the card for later, you can set setup_future_usage='off_session' on the PaymentIntent or attach the customer to it so that Stripe knows to save the card on file

   Subscription (and mixed cart): Create a Subscription in Stripe in “incomplete” status, so that it can be paid for now. Use the parameters:
   customer: the ID of the Customer you determined/created.
   items: the recurring price(s) the user chose.
   add_invoice_items: any one-time price IDs for one-time products in the cart (if applicable)
   payment_behavior: 'default_incomplete': this tells Stripe not to attempt payment yet, but to create an invoice and PaymentIntent that you will confirm after collecting payment details
   expand: ['latest_invoice.payment_intent'] (or in newer API versions, expand ['latest_invoice.confirmation_secret'] as seen in Stripe docs) so that the Stripe response includes the PaymentIntent client secret needed for confirmation

   Optionally, payment_settings[save_default_payment_method] = 'on_subscription' so that the provided card will be saved to the customer and set as the default for future subscription renewals
   

   The Stripe Subscription creation will return a Subscription object in status incomplete along with an associated PaymentIntent for the first payment (unless the subscription has a free trial or $0 due now, in which case Stripe provides a SetupIntent via pending_setup_intent instead)
   docs.stripe.com
   . You will need to capture the PaymentIntent’s client secret from this response.
   D. Store Additional Fields: If your checkout collects arbitrary additional fields (custom form inputs from the merchant’s config), save them in your database at this point (attach them to the order or customer record as needed). You can also attach them to Stripe objects via metadata if useful, though it’s not required – storing in your system is typically enough. E. Idempotency & Duplicate Handling: Ensure your endpoint that creates PaymentIntents/Subscriptions is idempotent or tied to the checkout ID to avoid creating multiple Stripe objects if the user resubmits. If a CheckoutSession already has associated Stripe IDs, reuse them or return an error if already completed.
4. Front-End: Collecting Payment Details with Stripe Elements
   On the front end, use Stripe.js with Stripe Elements (specifically the Payment Element) to collect payment details in a single unified form. This approach makes it easy to support many payment methods (cards, wallets, bank redirects, BNPL, etc.) in one UI component. Key steps on the frontend (React with Inertia):
   Initialize Stripe Elements: After loading Stripe.js, initialize Elements with your publishable key. If you are not creating a PaymentIntent up front, you can configure the Payment Element in deferred mode by providing the amount, currency, and flow mode. For example, Stripe allows rendering the Payment Element before an intent is created by passing an options object like: { mode: 'payment' or 'subscription', amount: 1099, currency: 'usd', payment_method_configuration: 'pmc_xxx' } when calling stripe.elements()
   docs.stripe.com
   . This tells the Payment Element what methods could be available. You might use 'mode: subscription' if there’s a recurring item in the cart (so that Payment Element knows to expect a subscription confirmation later), or 'mode: payment' for one-time. The payment_method_configuration is an optional Stripe feature that can limit which methods show (see Multi-Method Logic below).
   Mount the Payment Element: Create the Payment Element and mount it in your form. For example: const elements = stripe.elements(options); const paymentElement = elements.create('payment', {layout: 'accordion'}); paymentElement.mount('#payment-element'); This mounted element will automatically display the available payment method options (card, Klarna, etc.) in an accordion picker UI
   docs.stripe.com
   . The user can expand and enter the details for their chosen method. The Payment Element will handle validation and (for wallets or certain methods) pop-ups as needed.
   Handle Form Submission: When the user clicks your “Pay”/“Subscribe” button, intercept the form submission. Before contacting your backend, call elements.submit() to ensure any embedded card fields or wallet selections in the Payment Element are validated and completed
   docs.stripe.com
   . This is particularly important if using wallets like Apple Pay or Link, as Payment Element might need to pop up a wallet sheet at this point.
   Create the Stripe Intent on Demand: After validation, send a request to your backend (e.g. an Inertia/axios POST to /checkout/{id}/create-intent) to perform the steps in section 3 above. This endpoint should create the PaymentIntent or Subscription+PaymentIntent at that moment. The backend responds with a JSON containing at least { clientSecret: "...", intentType: "payment"|"setup" }. (The intentType can be determined by backend: if a subscription was created and it has no immediate payment, you’d get a SetupIntent client secret for future off-session payments, otherwise it’s a PaymentIntent.)
   Confirm the Payment on the Client: Now use Stripe.js to confirm the payment or setup intent using the details the customer entered. Since you have already collected the payment info via the Payment Element, you do not need to collect it again – you simply use the Payment Element and client secret to confirm. Depending on the scenario:
   If the backend returned a PaymentIntent client secret (intentType === "payment"), call stripe.confirmPayment({ elements, clientSecret, confirmParams: {return_url: "https://yourdomain.com/checkout/{id}/return"} }).
   If it returned a SetupIntent for a no-charge-yet subscription (intentType === "setup"), call stripe.confirmSetup({ elements, clientSecret, confirmParams: {return_url: ...} })
   docs.stripe.com
   .
   Providing a return_url is important for redirect-based methods
   docs.stripe.com
   . Stripe will redirect customers to this URL after they authenticate/authorize a payment on an external site (for example, completing a bank authorization or a Klarna payment flow)
   docs.stripe.com
   . You can set redirect: 'if_required' in the options to only perform a redirect for those methods that need it, staying on the page for card payments, etc.
   docs.stripe.com
   .
   Handling the Redirect and Confirmation: If a redirect occurs (e.g., user goes to Klarna’s site or their bank’s 3D Secure page), Stripe will eventually redirect them to the return_url. On that return page, you should retrieve the Checkout session by its ID (perhaps included in the return_url query params or stored in session) and check the status:
   You can use Stripe.js again to verify the status, or better, have your backend verify via webhook (preferred).
   Webhooks: It’s best practice to listen for Stripe webhook events like payment_intent.succeeded, payment_intent.processing, invoice.payment_succeeded, or checkout.session.completed (if you used Checkout sessions) to know definitively that the payment was successful. In your webhook handler, update the order status in your DB and trigger any fulfillment.
   When the user returns to your site, you can call your backend to get the latest status of that Checkout. If it’s paid, show the success/order confirmation. If it’s incomplete (perhaps the user canceled or something failed), allow them to retry or choose a different method.
   Embedded Checkout note: If the checkout is embedded in an iframe on the merchant’s site (ui_mode=embedded), be aware that redirect-based methods may not work seamlessly inside an iframe. Stripe explicitly cautions against placing the Payment Element inside another iframe because methods like Klarna or bank redirects cannot properly break out to redirect the user
   docs.stripe.com
   . In an embedded scenario, you might need to use the return_url to break out of the iframe (for example, target the top window), or use a Stripe-hosted redirect page. Plan and test accordingly so that, for instance, a Klarna payment opens the redirect in the top-level context. If needed, you can detect such methods and use JavaScript postMessage to communicate with the parent page to handle the redirect.
5. Multi-Country & Multi-Payment Method Intelligence
   To meet the requirement of supporting all Stripe payment methods that make sense for each context, you’ll need to implement logic that filters available methods both on the front end (what to show the user) and in creating the Stripe intents:
   Determine Available Methods: Stripe supports a wide array of payment method types, but their availability depends on factors like the merchant’s account settings, the customer’s location, the transaction currency, and whether the payment is one-time or recurring
   docs.stripe.com
   docs.stripe.com
   . For example:
   Klarna is supported for one-time payments in many countries (e.g. Australia, US, much of Europe) with various currencies
   docs.stripe.com
   , but Klarna is not suitable for subscriptions (recurring charges) in most cases
   docs.stripe.com
   docs.stripe.com
   .
   ACH Direct Debit or iDEAL might only work if the customer’s bank/account is in a specific country (US for ACH, Netherlands for iDEAL, etc.).
   Some methods have amount limits or only support certain currencies.
   No Recurring on Certain Methods: As a rule, Buy Now Pay Later (BNPL) options (Klarna, Afterpay/Clearpay, Affirm, etc.) and many bank redirect methods do not support off-session recurring charges. Stripe’s documentation notes that these methods are not available when using subscription or setup modes
   docs.stripe.com
   docs.stripe.com
   . Therefore, if the cart contains a subscription:
   Exclude BNPL methods from this checkout. For instance, do not show Klarna or Afterpay in the Payment Element if a subscription is present (you might configure Stripe’s PaymentElement to only show card, bank debit, or wallet options in that case).
   Ensure the Stripe Subscription’s payment settings use only appropriate methods. In practice, if you use automatic_payment_methods with a subscription’s invoice, Stripe will automatically try suitable saved methods (usually card or bank debits). It won’t, for example, attempt to charge Klarna for a renewal – that’s not supported.
   If a merchant has enabled a method that isn’t compatible with the scenario (like Klarna for subscriptions), your code should intelligently omit it to prevent errors.
   Use Stripe’s Dynamic Method Tools: To simplify, you can use Stripe’s dynamic payment methods and Payment Method Configuration features. For example, you could create one configuration for one-time checkouts and another for subscription checkouts, each enabling only the relevant methods (Stripe allows toggling methods on/off in the Dashboard for each config)
   docs.stripe.com
   docs.stripe.com
   . Then, when initializing the Payment Element, pass the payment_method_configuration ID for the appropriate scenario
   docs.stripe.com
   . Stripe will then automatically display only the methods you enabled (and which are available given country/currency). This can handle some of the intelligence for you, especially for country/currency filtering – “A buyer sees only payment methods that are turned on and compatible with the payment location and currency.”
   docs.stripe.com
   . If not using configs, you’ll implement the filtering logic manually (e.g., determining customer country via IP or billing address and cross-referencing Stripe’s support tables).
   Example – Klarna in AU: If the customer is in Australia and the checkout has a subscription, your logic should detect that Klarna is not applicable (Klarna doesn’t support recurring charges off-session, and even if Stripe’s API allowed the first payment, subsequent renewals would fail)
   docs.stripe.com
   docs.stripe.com
   . Thus, do not display Klarna for that case. On the other hand, if it’s a one-time purchase in Australia, Klarna is supported (AUD currency, AU business, AU customer) and can be shown as an option
   docs.stripe.com
   . Similar considerations apply to other methods (e.g. iDEAL only for NL customers with EUR, etc.). Always intersect the sets: Merchant-enabled methods ∩ Stripe-supported for currency/country ∩ Suitable for one-time vs recurring.
   Presentment Currency: Ensure the currency of the PaymentIntent or Subscription is set correctly for the transaction (likely the merchant’s default or the product’s currency). Some methods won’t show if the currency is unsupported (e.g. iDEAL only shows if currency is EUR). The Payment Element will take the currency (from PaymentIntent or from the elements options if using deferred mode) and automatically filter out methods that don’t support that currency.
6. Storing Customer and Payment Method Details
   You mentioned wanting to let returning customers see their saved cards or add new cards, without necessarily creating the customer object up front. Here’s a balanced approach:
   Deferred Customer Creation: As noted, you can create the Stripe customer at payment time. If you do so and attach the email, Stripe will prevent duplicate customers with the same email on creation (or you can search for existing customers by email in advance). For a returning user (same email) you might end up reusing an existing customer.
   Showing Saved Payment Methods: Stripe’s Payment Element can display a returning customer’s saved payment methods if it knows the customer’s identity and has an Ephemeral Key for that customer. One workflow:
   Once the user enters their email, you could call your backend to retrieve or create a Stripe Customer for that email (if your tenant’s integration allows it). If you get a Customer ID, generate an Ephemeral Key for that customer (Stripe has an API for this).
   Pass the Customer ID and Ephemeral Key when initializing Stripe Elements: e.g. stripe.elements({ clientSecret: ephemeralKey.secret, customer: customerId, ... }). This can enable the Payment Element to fetch saved payment methods (like saved cards) and show them as options (for instance, “Use Visa ending 4242”)
   docs.stripe.com
   . Note: Only do this if you have verified the user’s identity (perhaps via an email link or login) to avoid exposing someone else’s saved payment methods.
   Alternatively, if you prefer not to do this pre-payment, the user will simply enter new payment details. Stripe can still save the card for future use if you attach the customer and set setup_future_usage on the PaymentIntent or save_default_payment_method on the subscription. The next time the user comes (with the same email), you could then fetch their Stripe customer and show their saved card then.
   Attach Payment Method to Customer: Ensure that when confirming the payment, you instruct Stripe to save the payment method to the customer for future use. For one-time PaymentIntents, set setup_future_usage='off_session' or use the newer PaymentElement approach of automatic saving when a customer is provided
   docs.stripe.com
   . For Subscriptions, as mentioned, use save_default_payment_method: 'on_subscription'
   docs.stripe.com
   . This way, the card or bank info is stored in Stripe vault and can be reused for subsequent checkouts or subscription renewals.
   Returning to an Incomplete Checkout: If a customer leaves in the middle (e.g., they were redirected to a bank and didn’t complete, or they just closed the page), your system should allow them to resume. Because you deferred intent creation until form submission, you likely won’t have a lingering PaymentIntent unless they had clicked pay. If a PaymentIntent was created and is in requires_confirmation or requires_action state, you could retrieve it when they return and perhaps allow retrying confirmation. But a simpler approach is often: if the checkout wasn’t marked complete, let them start the payment step fresh (possibly with the same Stripe customer so their info is not lost). The Checkout record in your DB can track that they haven’t paid yet. When they come back (maybe via a saved link or by logging in), you load their checkout and just go to the payment page again. If you already have a Stripe Customer for them, you can show saved methods as above. Then proceed with a new PaymentIntent/Subscription creation on submission.
7. Post-Payment Actions and Provisioning
   Once the payment is successfully processed (either instantly for cards or after a redirect flow completes for others), you need to finalize the checkout:
   Mark Order as Paid: Update your database that the checkout is complete, create an Order record if you have a separate concept of orders, and record all relevant IDs (Stripe PaymentIntent ID, Charge ID, Subscription ID, etc.) in your records.
   Provision Items: For each item in the cart, trigger the appropriate fulfillment:
   For one-time purchases, allocate or ship the product, grant digital access, etc., and note in your system that item is delivered.
   For the subscription, record the subscription ID and plan details in your system so that you know the user is subscribed. If the subscription involves provisioning (e.g. unlocking a SaaS account, scheduling future jobs), handle that.
   Because you combined them in one Stripe call if it was a mixed cart, you may get one webhook (e.g. invoice.payment_succeeded with invoice containing both items) to signal success

   . Your webhook handler can parse that and create both the one-time order and the subscription record in your DB.
   Redirect to Order Status: After payment, your front-end should navigate the user to a confirmation page (which could include summary of their order or subscription). If they try to refresh or revisit the checkout URL, your app should recognize the session as completed and redirect them to that confirmation instead of reattempting payment (preventing double charges).
   Handle Failures Gracefully: If the payment fails or is abandoned:
   If Stripe returns an immediate error on confirmPayment (e.g. card declined), display the error and let the user choose a different method or fix details.
   If a redirect payment is not completed (user didn’t finish it), the PaymentIntent may end up in status requires_payment_method again after some time. You can allow the user to try again with a new method in that case.
   Cancel any incomplete Stripe objects if necessary after some timeout to avoid leaving holds (for example, if a PaymentIntent for a card was created but not confirmed, you might cancel it after an hour or day).
   Webhooks and Async Events: Use webhooks as a source of truth for payment completions. For example, listen for payment_intent.succeeded (for one-time payments) and invoice.payment_succeeded (for subscription invoices) events. This is important for catching scenarios where the user might close the browser right after paying or if a background step happens. Your webhook handler can mark the checkout as paid and trigger email receipts or other post-payment actions. Since you collect customer email, you can send a confirmation email from Stripe or from your system.
   Putting It All Together: Step-by-Step Workflow
   To summarize, here is a high-level step-by-step flow implementing the above points:
   Checkout Initialization: Create a Checkout session in your DB when the user begins. Collect email and any other info on the first page. Possibly create a Stripe Customer at this point (optional; you can wait until payment). If you do, store the customer ID.
   Cart and Mode Selection: User selects products and whether they’re one-time or subscription. Update the Checkout session with the chosen items and mode. Use this to decide the Stripe integration path (mode=payment vs subscription).
   Prepare Payment Element: On the payment page, initialize Stripe Elements. If you haven’t created a PaymentIntent yet, configure the PaymentElement with mode, amount, currency, and possibly a Stripe payment method configuration that matches the scenario
   docs.stripe.com
   . Mount the Payment Element UI for the user to input card details or choose other methods.
   Display Allowed Payment Methods: The Payment Element (or your custom UI) will show the filtered list of methods. Ensure disallowed methods (by region or by subscription logic) are not shown. For example, if it’s a subscription checkout, only show methods that support recurring payments (cards, certain bank debits, wallets, etc., but not Klarna/Affirm/Afterpay)
   docs.stripe.com
   docs.stripe.com
   . If you use Stripe’s automatic filtering with configs or PaymentIntent settings, this will be handled. Otherwise implement the logic before rendering the options.
   Collect Payment Details: Customer enters their card info, or selects a wallet, etc. They also provide any required billing details. The Payment Element handles validation.
   Initiate Payment (on Submit): When the user clicks “Pay”:
   Call elements.submit() to ensure any necessary wallet popups occur and data is complete
   docs.stripe.com
   .
   Send a request to your backend (include the Checkout session ID and maybe selected payment method if you gathered one, though with Payment Element you typically don’t need to send payment details themselves).
   Backend logic creates the Stripe objects:
   If one-time: create PaymentIntent (amount = sum of cart, currency, customer = (if exists), automatic_payment_methods enabled or specific types).
   If subscription: create Customer if needed, then create Subscription (items, add_invoice_items, payment_behavior='default_incomplete', etc.)
   docs.stripe.com
   . Retrieve the PaymentIntent from the subscription’s initial invoice.
   Backend returns { clientSecret, intentType } (and possibly an updated Checkout status).
   Confirm the Payment: In the frontend, call the appropriate Stripe confirm method:
   stripe.confirmPayment({...}) if it’s a PaymentIntent
   docs.stripe.com
   .
   stripe.confirmSetup({...}) if it’s a SetupIntent for a trialing subscription
   docs.stripe.com
   .
   Provide elements and the clientSecret from backend. Also pass return_url: yourDomain/checkout/{id}/return so Stripe can redirect after 3D Secure or redirect-based methods
   docs.stripe.com
   .
   Handle 3DS or Redirects: If the card requires 3D Secure, Stripe.js will handle the popup. If the user chose a method like Klarna or iDEAL, they will be redirected to an external site. After completion, the user lands on your return URL page.
   Complete the Order: On return, or via webhook:
   Verify the PaymentIntent or Invoice status. If successful (succeeded/paid), mark the Checkout as complete in your DB.
   Redirect or display the Order Confirmation page to the user, showing their order number, what they purchased (one-time items) and subscription details (if any).
   If the Stripe objects indicate the customer’s payment method is saved (which it should, given our settings), you may also indicate to the user that their payment method is saved for future use.
   If the payment failed or was canceled, allow the user to return to the payment step and choose a different method (the Checkout session stays incomplete).
   Prevent Reuse of Completed Checkout: If the user or merchant tries to reuse a completed checkout link, your app should detect that and route to the status page. Also, in case of partial failures (one part charged and another not – which is unlikely if using the combined invoice method), have a compensation strategy (e.g., automatically refund the charge if the subscription creation failed, and inform the user).
   Throughout this process, use Stripe’s latest APIs and your Laravel backend to ensure atomicity where possible, and fall back on idempotent design plus webhook reconciliation to handle any edge cases.
   Conclusion
   The best course of action is to implement a just-in-time PaymentIntent/Subscription creation workflow combined with Stripe’s Payment Element for flexibility in payment methods. This approach allows the checkout to be highly dynamic (supporting toggling between purchase vs subscription, and switching payment methods) while only finalizing payment details at the last step. By leveraging Stripe’s subscription invoice capabilities, you can handle mixed carts in one transaction
   stackoverflow.com
   . Use webhooks and robust state tracking to ensure no double-processing and to handle asynchronous payment outcomes. In summary, build the checkout process to collect all necessary info (email, items, etc.) first, then create the Stripe intent(s) at the moment of payment confirmation, using the appropriate API (PaymentIntent for one-time, Subscription for recurring) with invoice items to cover any one-time charges
   stackoverflow.com
   . Confirm the payment on the client side with Stripe.js for a smooth, secure experience that supports 3D Secure and redirect flows
   docs.stripe.com
   . Implement intelligent filtering of payment methods so customers only see viable options for their locale and purchase type (e.g. exclude non-recurring-capable methods for subscriptions)
   docs.stripe.com
   docs.stripe.com
   . Finally, store the results (customer, payment method, order details) in your system and allow the customer to revisit the checkout or manage their subscription as needed. Following this workflow will meet the requirements and provide a flexible, user-friendly checkout experience. References:
   Stripe Documentation – Collect payment details before creating an Intent (demonstrates deferring intent creation and confirming with Payment Element)
   docs.stripe.com
   docs.stripe.com
   Stripe Documentation – How to combine a subscription and one-time payment (using invoice items on subscription)
   stackoverflow.com
   Stripe Documentation – Payment method support and restrictions (notes on BNPL not supporting subscriptions, and regional availability)
   docs.stripe.com
   docs.stripe.com
   docs.stripe.com
   Stripe Documentation – Stripe Checkout Session API (describes how Stripe’s own Checkout handles one-time vs subscription mode with line items)
   docs.stripe.com
   docs.stripe.com
   Stripe Documentation – Payment Method Configurations (for dynamically controlling which methods show up)
   docs.stripe.com
   Stripe Docs – Confirming payment with redirects (stripe.confirmPayment)
   docs.stripe.com
   (handling redirect flows)
