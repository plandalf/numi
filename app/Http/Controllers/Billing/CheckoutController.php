<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Stripe\Stripe;
use Stripe\Price;
use Illuminate\Support\Facades\Log;

class CheckoutController extends Controller
{
    public function billing(Request $request)
    {
        if (! config('cashier.enable_billing')) {
            return redirect()->route('dashboard');
        }

        $organization = auth()->user()->currentOrganization;

        // Set Stripe API key
        Stripe::setApiKey(config('cashier.secret'));

        // Get all subscriptions for the organization with items loaded
        $subscriptions = $organization->subscriptions()
            ->with('items')
            ->get()
            ->map(function ($subscription) {
                // Get price information from Stripe
                $priceInfo = $this->getStripePriceInfo($subscription->stripe_price);

                return [
                    'id' => $subscription->id,
                    'stripe_id' => $subscription->stripe_id,
                    'type' => $subscription->type,
                    'stripe_status' => $subscription->stripe_status,
                    'stripe_price' => $subscription->stripe_price,
                    'quantity' => $subscription->quantity,
                    'trial_ends_at' => $subscription->trial_ends_at?->toISOString(),
                    'ends_at' => $subscription->ends_at?->toISOString(),
                    'created_at' => $subscription->created_at->toISOString(),
                    'updated_at' => $subscription->updated_at->toISOString(),
                    'active' => $subscription->active(),
                    'on_trial' => $subscription->onTrial(),
                    'canceled' => $subscription->canceled(),
                    'trial_days_left' => $subscription->onTrial() ? $subscription->trial_ends_at->diffInDays(now()) : 0,
                    'product_name' => $subscription->product_name ?? null,
                    'price_info' => $priceInfo,
                    'items' => $subscription->items->map(function ($item) {
                        $itemPriceInfo = $this->getStripePriceInfo($item->stripe_price);

                        return [
                            'id' => $item->id,
                            'stripe_id' => $item->stripe_id,
                            'stripe_product' => $item->stripe_product,
                            'stripe_price' => $item->stripe_price,
                            'quantity' => $item->quantity,
                            'price_info' => $itemPriceInfo,
                        ];
                    }),
                ];
            });

        return Inertia::render('organizations/settings/billing', [
            'subscriptions' => $subscriptions,
        ]);
    }
    /**
     * Get Stripe price information for a given price ID
     */
    private function getStripePriceInfo(?string $priceId): ?array
    {
        if (!$priceId) {
            return null;
        }

        try {
            $price = Price::retrieve($priceId, [
                'expand' => ['product']
            ]);

            // dd($price->product);

            return [
                'id' => $price->id,
                'currency' => $price->currency,
                'unit_amount' => $price->unit_amount,
                'unit_amount_decimal' => $price->unit_amount_decimal,
                'type' => $price->type,
                'recurring' => $price->recurring ? [
                    'interval' => $price->recurring->interval,
                    'interval_count' => $price->recurring->interval_count,
                ] : null,
                // 'product' => [
                //     'id' => $price->product->id,
                //     'name' => $price->product->name,
                //     'description' => $price->product->description,
                // ],
                'formatted_amount' => $this->formatPrice($price->unit_amount, $price->currency),
                'formatted_with_interval' => $this->formatPriceWithInterval($price),
            ];
        } catch (\Exception $e) {
            dd($e);
            Log::warning('Failed to fetch Stripe price information', [
                'price_id' => $priceId,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Format price amount for display
     */
    private function formatPrice(int $amount, string $currency): string
    {
        $formatted = number_format($amount / 100, 2);
        $symbol = $this->getCurrencySymbol($currency);

        return $symbol . $formatted;
    }

    /**
     * Format price with interval for recurring prices
     */
    private function formatPriceWithInterval(\Stripe\Price $price): string
    {
        $formattedAmount = $this->formatPrice($price->unit_amount, $price->currency);

        if (!$price->recurring) {
            return $formattedAmount;
        }

        $interval = $price->recurring->interval;
        $intervalCount = $price->recurring->interval_count;

        if ($intervalCount === 1) {
            return $formattedAmount . '/' . $interval;
        }

        return $formattedAmount . '/' . $intervalCount . ' ' . $interval . 's';
    }

    /**
     * Get currency symbol
     */
    private function getCurrencySymbol(string $currency): string
    {
        $symbols = [
            'usd' => '$',
            'eur' => '€',
            'gbp' => '£',
            'cad' => 'C$',
            'aud' => 'A$',
            'jpy' => '¥',
        ];

        return $symbols[strtolower($currency)] ?? strtoupper($currency) . ' ';
    }
}
