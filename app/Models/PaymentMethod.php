<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;

    protected $fillable = [
        'integration_id',
        'type',
        'brand',
        'last4',
        'exp_month',
        'exp_year',
        'external_id',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function integration()
    {
        return $this->belongsTo(Integration::class);
    }

    public function checkoutSessions()
    {
        return $this->hasMany(\App\Models\Checkout\CheckoutSession::class);
    }
}
