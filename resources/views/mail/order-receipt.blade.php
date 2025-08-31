<x-mail::message>
<x-slot:header>
<x-mail::header :url="config('app.url')">
{{ $organization->name ?? config('app.name') }}
</x-mail::header>
</x-slot:header>
@if($isTest)
<x-mail::panel>
This is a test receipt preview. No payment was processed.
</x-mail::panel>
@endif

# Receipt for Order #{{ $order->order_number }}

**Date**: {{ $order->created_at->format('M j, Y g:i A') }}

@if($customer)
**Billed To**: {{ $customer->name }} <{{ $customer->email }}>
@endif

@if($paymentDisplay)
**Payment Method**: {{ $paymentDisplay }}
@endif

---

## Items

@component('mail::table')
| Item | Qty | Unit Price | Line Total |
|:-----|:---:|-----------:|-----------:|
@foreach($items as $item)
| {{ $item['name'] }} | {{ $item['quantity'] }} | {{ $item['unit_price_formatted'] }} | {{ $item['line_total_formatted'] }} |
@endforeach
@endcomponent

@php($spacer='&nbsp;')
<div style="text-align:right">
<div><strong>Subtotal:</strong> {{ $subtotal }}</div>
@if(!empty($discounts))
@foreach($discounts as $discount)
<div><strong>{{ $discount['name'] }}:</strong> {{ $discount['amount'] }}</div>
@endforeach
@endif
<div style="margin-top:6px;font-size:18px"><strong>Total:</strong> {{ $total }}</div>
</div>

---

You can view your order status and receipt here:

@if(!empty($publicUrl))
<x-mail::button :url="$publicUrl">
View Order
</x-mail::button>
@endif

@if(!empty($receiptUrl))
<x-mail::button :url="$receiptUrl">
View Receipt
</x-mail::button>
@endif

Thanks,<br>
{{ $organization->name ?? config('app.name') }}

<x-slot:footer>
<x-mail::footer>
© {{ date('Y') }} {{ $organization->name ?? config('app.name') }}. All rights reserved.
</x-mail::footer>
</x-slot:footer>
</x-mail::message>
