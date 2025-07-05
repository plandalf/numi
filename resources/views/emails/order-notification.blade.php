<x-mail::message>
# New Order Received - Fulfillment Required

Hello {{ $organization->name }} Team,

A new order has been placed and requires fulfillment attention.

## Order Details

**Order ID:** #{{ $order->id }}  
**Order Status:** {{ $order->status->label() }}  
**Fulfillment Method:** {{ $order->fulfillment_method?->label() ?? 'Not Set' }}  
**Order Total:** ${{ number_format($order->total_amount / 100, 2) }}  
**Currency:** {{ strtoupper($order->currency) }}  

@if($customer)
## Customer Information

**Name:** {{ $customer->name }}  
**Email:** {{ $customer->email }}  
@endif

## Order Items

@foreach($items as $item)
### {{ $item->offerItem?->name ?? 'Item' }}

- **Quantity:** {{ $item->quantity }}
- **Price:** ${{ number_format($item->price->amount->getAmount() / 100, 2) }}
- **Total:** ${{ number_format($item->total_amount / 100, 2) }}
- **Fulfillment Status:** {{ $item->fulfillment_status->label() }}
- **Delivery Method:** {{ $item->delivery_method?->label() ?? 'Not Set' }}

@if($item->fulfillment_status->value === 'pending')
⚠️ **This item requires fulfillment action**
@endif

---
@endforeach

## Fulfillment Actions Required

@if($order->fulfillment_method?->value === 'manual')
This order requires **manual fulfillment**. Please review each item and take appropriate action.
@elseif($order->fulfillment_method?->value === 'automation')
This order is set for **automatic fulfillment**. Please verify that automation completed successfully.
@elseif($order->fulfillment_method?->value === 'api')
This order is set for **API fulfillment**. Please check integration status.
@else
Please review the fulfillment method and take appropriate action.
@endif

<x-mail::button :url="$dashboardUrl">
View Order in Dashboard
</x-mail::button>

## Next Steps

1. Review order items and fulfillment requirements
2. Process each item according to your fulfillment method
3. Update tracking information if applicable
4. Mark items as fulfilled when complete

If you have any questions about this order or need assistance with fulfillment, please contact your system administrator.

Thanks,<br>
{{ $organization->name }} Fulfillment System
</x-mail::message> 