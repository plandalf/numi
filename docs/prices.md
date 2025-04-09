# prices

for albert

both exist as Price locally and linked on Stripe

if on stripe, cannot modify amounts

Copy the price sync from plandalf but integrate it specifically with numi

- [ ] api search endpoint for prices


Prices have a `scope` of `list` or `custom`

List prices are public prices, custom are variations of list prices
 
## Price model
| attribute                | type                                                          |
|--------------------------|---------------------------------------------------------------|
| product_id               | product association                                           |
| organization_id          | org                                                           |
| parent_list_price_id     | "list price" (public price)                                   |
| scope                    | `list` or `custom`                                            |
| type                     | one_time                                                      |graduated|standard|volume|package                     |
| amount                   | int                                                           |
| currency                 | char(3)                                                       |
| properties               | object or array of custom amount properties for tiered prices |
| name                     | -                                                             |
| lookup_key               | public identifier (routeKey)                                  |
| renew_interval           | day,week,month,year                                           |
| billing_anchor           | start_of_month, anniversary                                   |
| recurring_interval_count | int                                                           |
| cancel_after_cycles      | int                                                           |
| gateway_provider         | thing                                                         |
| gateway_price_id         | thing                                                         |
| is_active                | bool                                                          |
| archived_at              | carbon                                                        |
