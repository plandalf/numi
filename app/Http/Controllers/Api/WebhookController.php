<?php

namespace App\Http\Controllers\Api;

use App\Actions\Fulfillment\ProcessExternalFulfillmentAction;
use App\Enums\ExternalPlatform;
use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function __construct(
        private ProcessExternalFulfillmentAction $processExternalFulfillmentAction
    ) {}

    /**
     * Handle Shopify webhooks.
     */
    public function shopify(Request $request, Organization $organization): JsonResponse
    {
        return $this->processWebhook($request, $organization, ExternalPlatform::SHOPIFY);
    }

    /**
     * Handle Etsy webhooks.
     */
    public function etsy(Request $request, Organization $organization): JsonResponse
    {
        return $this->processWebhook($request, $organization, ExternalPlatform::ETSY);
    }

    /**
     * Handle ClickFunnels webhooks.
     */
    public function clickfunnels(Request $request, Organization $organization): JsonResponse
    {
        return $this->processWebhook($request, $organization, ExternalPlatform::CLICKFUNNELS);
    }

    /**
     * Handle WooCommerce webhooks.
     */
    public function woocommerce(Request $request, Organization $organization): JsonResponse
    {
        return $this->processWebhook($request, $organization, ExternalPlatform::WOOCOMMERCE);
    }

    /**
     * Handle Amazon webhooks.
     */
    public function amazon(Request $request, Organization $organization): JsonResponse
    {
        return $this->processWebhook($request, $organization, ExternalPlatform::AMAZON);
    }

    /**
     * Handle custom platform webhooks.
     */
    public function custom(Request $request, Organization $organization): JsonResponse
    {
        return $this->processWebhook($request, $organization, ExternalPlatform::CUSTOM);
    }

    /**
     * Process webhook from external platform.
     */
    private function processWebhook(Request $request, Organization $organization, ExternalPlatform $platform): JsonResponse
    {
        try {
            // Validate webhook signature if configured
            $this->validateWebhookSignature($request, $organization, $platform);

            // Get webhook data
            $webhookData = $request->all();

            // Log webhook for debugging
            Log::info('External webhook received', [
                'platform' => $platform->value,
                'organization_id' => $organization->id,
                'headers' => $request->headers->all(),
                'data' => $webhookData,
            ]);

            // Process the external fulfillment
            $externalFulfillment = $this->processExternalFulfillmentAction->execute(
                $organization,
                $platform,
                $webhookData
            );

            return response()->json([
                'status' => 'success',
                'message' => 'Webhook processed successfully',
                'external_fulfillment_id' => $externalFulfillment->id,
            ]);

        } catch (\Exception $e) {
            Log::error('Webhook processing failed', [
                'platform' => $platform->value,
                'organization_id' => $organization->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Webhook processing failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate webhook signature based on platform.
     */
    private function validateWebhookSignature(Request $request, Organization $organization, ExternalPlatform $platform): void
    {
        $config = $organization->external_platform_config[$platform->value] ?? [];
        
        if (!isset($config['webhook_secret'])) {
            // Skip validation if no secret is configured
            return;
        }

        $secret = $config['webhook_secret'];
        $signature = $this->getWebhookSignature($request, $platform);
        
        if (!$signature) {
            throw new \Exception('Missing webhook signature');
        }

        $expectedSignature = $this->calculateExpectedSignature($request, $platform, $secret);
        
        if (!hash_equals($expectedSignature, $signature)) {
            throw new \Exception('Invalid webhook signature');
        }
    }

    /**
     * Get webhook signature from request headers based on platform.
     */
    private function getWebhookSignature(Request $request, ExternalPlatform $platform): ?string
    {
        return match ($platform) {
            ExternalPlatform::SHOPIFY => $request->header('X-Shopify-Hmac-Sha256'),
            ExternalPlatform::ETSY => $request->header('X-Etsy-Signature'),
            ExternalPlatform::CLICKFUNNELS => $request->header('X-ClickFunnels-Signature'),
            ExternalPlatform::WOOCOMMERCE => $request->header('X-WC-Webhook-Signature'),
            ExternalPlatform::AMAZON => $request->header('X-Amz-Sns-Message-Id'),
            ExternalPlatform::CUSTOM => $request->header('X-Webhook-Signature'),
        };
    }

    /**
     * Calculate expected signature based on platform.
     */
    private function calculateExpectedSignature(Request $request, ExternalPlatform $platform, string $secret): string
    {
        $payload = $request->getContent();
        
        return match ($platform) {
            ExternalPlatform::SHOPIFY => base64_encode(hash_hmac('sha256', $payload, $secret, true)),
            ExternalPlatform::ETSY => hash_hmac('sha256', $payload, $secret),
            ExternalPlatform::CLICKFUNNELS => hash_hmac('sha256', $payload, $secret),
            ExternalPlatform::WOOCOMMERCE => base64_encode(hash_hmac('sha256', $payload, $secret, true)),
            ExternalPlatform::AMAZON => hash_hmac('sha256', $payload, $secret),
            ExternalPlatform::CUSTOM => hash_hmac('sha256', $payload, $secret),
        };
    }
} 