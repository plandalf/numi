<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt - {{ $order->uuid }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.3;
            color: #333;
            background: white;
            margin: 0;
            padding: 0;
        }
        
        .receipt {
            width: 100%;
            height: 100vh;
            margin: 0;
            background: white;
            display: flex;
            flex-direction: column;
        }
        
        .header {
            background: #2c3e50;
            color: white;
            padding: 15px 20px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .header .subtitle {
            font-size: 12px;
            opacity: 0.9;
        }
        
        .content {
            padding: 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .receipt-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #ddd;
        }
        
        .receipt-info .left, .receipt-info .right {
            flex: 1;
        }
        
        .receipt-info .right {
            text-align: right;
        }
        
        .label {
            font-size: 10px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 3px;
            font-weight: bold;
        }
        
        .value {
            font-size: 12px;
            font-weight: normal;
            color: #333;
            margin-bottom: 8px;
        }
        
        .items {
            margin-bottom: 20px;
            flex: 1;
        }
        
        .item {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 8px 0;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .item:last-child {
            border-bottom: none;
        }
        
        .item-details {
            flex: 1;
        }
        
        .item-name {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 2px;
        }
        
        .item-description {
            font-size: 10px;
            color: #666;
            margin-bottom: 2px;
        }
        
        .item-quantity {
            font-size: 10px;
            color: #666;
        }
        
        .item-price {
            font-weight: bold;
            font-size: 12px;
            text-align: right;
        }
        
        .total-section {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 12px;
        }
        
        .total-row:last-child {
            margin-bottom: 0;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            font-weight: bold;
            font-size: 14px;
        }
        
        .payment-info {
            background: #f8f9fa;
            padding: 15px;
            margin-bottom: 20px;
            border: 1px solid #ddd;
        }
        
        .payment-method {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .payment-icon {
            width: 20px;
            height: 20px;
            background: #28a745;
            border-radius: 3px;
            margin-right: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 10px;
            font-weight: bold;
        }
        
        .payment-details {
            flex: 1;
        }
        
        .payment-name {
            font-weight: bold;
            font-size: 12px;
        }
        
        .payment-meta {
            font-size: 10px;
            color: #666;
        }
        
        .transaction-id {
            margin-top: 8px;
        }
        
        .footer {
            text-align: center;
            padding: 15px 20px;
            background: #f8f9fa;
            border-top: 1px solid #ddd;
        }
        
        .footer p {
            margin: 3px 0;
            font-size: 11px;
            color: #666;
        }
        
        .amount {
            font-weight: bold;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .receipt {
                box-shadow: none;
                border: none;
                height: 100%;
                page-break-after: avoid;
            }
            .header {
                page-break-after: avoid;
            }
            .footer {
                page-break-before: avoid;
            }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <h1>Receipt</h1>
            <div class="subtitle">{{ $organization->name ?? 'PLANT' }}</div>
        </div>
        
        <div class="content">
            <div class="receipt-info">
                <div class="left">
                    <div class="label">Receipt Number</div>
                    <div class="value">{{ $order->uuid }}</div>
                    
                    <div class="label">Date</div>
                    <div class="value">{{ $formatted_date }}</div>
                    
                    <div class="label">Time</div>
                    <div class="value">{{ $formatted_time }}</div>
                </div>
                
                <div class="right">
                    <div class="label">Status</div>
                    <div class="value">{{ ucfirst($order->status->value) }}</div>
                    
                    @if($customer)
                    <div class="label">Customer</div>
                    <div class="value">{{ $customer->name }}</div>
                    <div class="value" style="font-size: 10px; color: #666;">{{ $customer->email }}</div>
                    @endif
                </div>
            </div>
            
            <div class="items">
                @foreach($items as $item)
                <div class="item">
                    <div class="item-details">
                        <div class="item-name">{{ $item->price->product->name }}</div>
                        @if($item->price->product->description)
                        <div class="item-description">{{ $item->price->product->description }}</div>
                        @endif
                        <div class="item-quantity">Qty: {{ $item->quantity }}</div>
                    </div>
                    <div class="item-price">${{ number_format($item->total_amount / 100, 2) }}</div>
                </div>
                @endforeach
            </div>
            
            <div class="total-section">
                <div class="total-row">
                    <span>Subtotal</span>
                    <span class="amount">${{ number_format($order->total_amount / 100, 2) }}</span>
                </div>
                <div class="total-row">
                    <span>Tax</span>
                    <span class="amount">$0.00</span>
                </div>
                <div class="total-row">
                    <span>Total</span>
                    <span class="amount">${{ number_format($order->total_amount / 100, 2) }}</span>
                </div>
            </div>
            
            @if($payment_method)
            <div class="payment-info">
                <div class="label">Payment Method</div>
                <div class="payment-method">
                    <div class="payment-icon">{{ strtoupper(substr($payment_method->type, 0, 1)) }}</div>
                    <div class="payment-details">
                        <div class="payment-name">{{ $payment_method->display_name }}</div>
                        @if($payment_method->isCard() && $payment_method->last4)
                        <div class="payment-meta">•••• {{ $payment_method->last4 }}</div>
                        @endif
                    </div>
                </div>
                @if($order->payment_id)
                <div class="transaction-id">
                    <div class="label">Transaction ID</div>
                    <div class="value" style="font-size: 10px;">{{ $order->payment_id }}</div>
                </div>
                @endif
            </div>
            @endif
        </div>
        
        <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>If you have any questions, please contact support.</p>
            <p style="margin-top: 10px; font-size: 9px; color: #999;">
                Receipt generated on {{ now()->format('M j, Y \a\t g:i A') }}
            </p>
        </div>
    </div>
</body>
</html> 