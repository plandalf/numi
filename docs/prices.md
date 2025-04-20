# prices

for albert

both exist as Price locally and linked on Stripe

if on stripe, cannot modify amounts

Copy the price sync from plandalf but integrate it specifically with numi

- [ ] api search endpoint for prices

users can add prices from stripe by searching it directly

// silly version is just GET getPricesFromStripe
// pagination should get translated 

GET /api/integrations/stripe/prices?search=pro&limit=25&page=2

Prices have a `scope` of `list` or `custom`

List prices are public prices, custom are variations of list prices

Creating a new price
POST /api/prices 
// copy from price_xxx + integration ID 

## Local creation
```
{
    "amount": 1000,
    "currency": "usd",
    "name": "Pro Plan"
}
```

## Integration Creation
```
{
    "integration_id": "abc123",
    "external_price_id": "price_1XYZ..."
}
```

For now, all prices are list prices

## Price model
| attribute                | type                                                           |
|--------------------------|----------------------------------------------------------------|
| product_id               | product association                                            |
| organization_id          | org                                                            |
| parent_list_price_id     | "list price" (public price)                                    |
| scope                    | `list` or `custom`                                             |
| type                     | "one_time,graduated,standard ,volume,package"                  |
| amount                   | int                                                            |
| currency                 | char(3)                                                        |
| properties               | object or array of custom amount properties for tiered prices  |
| name                     | -                                                              |
| lookup_key               | public identifier (routeKey)                                   |
| renew_interval           | day,week,month,year                                            |
| billing_anchor           | start_of_month, anniversary                                    |
| recurring_interval_count | int                                                            |
| cancel_after_cycles      | int                                                            |
| gateway_provider         | thing                                                          |
| gateway_price_id         | thing                                                          |
| is_active                | bool                                                           |
| archived_at              | carbon                                                         |

when creating prices

matching prices

- [ ] search via api 
- [ ] 
