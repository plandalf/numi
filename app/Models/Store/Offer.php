<?php

namespace App\Models\Store;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Offer extends Model
{
    /** @use HasFactory<\Database\Factories\OfferFactory> */
    use HasFactory;

    protected $table = 'store_offers';

    protected $fillable = [
        'name',

        'status',
        'organization_id',
    ];

    protected $casts = [
        
    ];
}
