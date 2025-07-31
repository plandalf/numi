<?php

namespace App\Apps\Plandalf\Actions;

use App\Workflows\Attributes\IsAction;
use App\Workflows\Automation\AppAction;
use App\Workflows\Automation\Bundle;
use App\Workflows\Automation\Field;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

#[IsAction(
    key: 'send-webhook',
    noun: 'Webhook',
    label: 'Send Webhook',
    description: 'Sends a webhook to a specified URL.',
)]
class SendWebhookAction extends AppAction
{
    public static function props()
    {
        return [
            Field::string('url', 'Webhook URL')
                ->required()
                ->help('The URL to which the webhook will be sent.'),
            Field::select('method', 'HTTP Method', 'The HTTP method to use for the webhook request.')
                ->required()
                ->default('POST')
                ->options([
                    'GET' => 'GET',
                    'POST' => 'POST',
                    'PUT' => 'PUT',
                    'DELETE' => 'DELETE',
                    'PATCH' => 'PATCH',
                ]),
            Field::json('payload', 'Payload')
                ->optional()
                ->help('The JSON payload to send with the webhook. Leave empty for GET requests.'),
            Field::map('headers', 'Headers')
                ->optional()
                ->help('Optional headers to include in the webhook request as key-value pairs.'),
        ];
    }

    public function __invoke(Bundle $bundle): array
    {
        $config = $bundle->input;

        $url = $config['url'] ?? '';
        $method = strtolower($config['method'] ?? 'POST');
        $payload = $config['payload'] ?? null;
        $headers = $config['headers'] ?? [];

        if (empty($url)) {
            throw new \InvalidArgumentException('Webhook URL is required');
        }

        // Validate URL format
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            throw new \InvalidArgumentException('Invalid webhook URL format');
        }

        try {
            // Start building the HTTP request
            $httpRequest = Http::timeout(30);

            // Add custom headers if provided
            if (!empty($headers) && is_array($headers)) {
                $httpRequest = $httpRequest->withHeaders($headers);
            }

            // Set default Content-Type for requests with payload
            if ($payload && !isset($headers['Content-Type'])) {
                $httpRequest = $httpRequest->withHeaders(['Content-Type' => 'application/json']);
            }

            // Send the request based on method
            switch ($method) {
                case 'get':
                    $response = $httpRequest->get($url);
                    break;
                case 'post':
                case 'put':
                case 'patch':
                case 'delete':
                    $response = $httpRequest->{$method}($url, $payload ? json_decode($payload, true) : []);
                    break;
                default:
                    throw new \InvalidArgumentException("Unsupported HTTP method: {$method}");
            }

            // Log the webhook attempt
            Log::info('Webhook sent successfully', [
                'url' => $url,
                'method' => $method,
                'status_code' => $response->status(),
                'organization_id' => $bundle->integration->organization_id ?? null,
            ]);

            if ($response->successful()) {
//                 fail!
            }

            return [
                'success' => true,
                'status_code' => $response->status(),
                'response_body' => $response->body(),
                'headers' => $response->headers(),
                'url' => $url,

                'payload' => $payload,
                'method' => $method,
            ];

        } catch (RequestException $e) {
            Log::error('Webhook request failed', [
                'url' => $url,
                'method' => $method,
                'error' => $e->getMessage(),
                'organization_id' => $bundle->integration->organization_id ?? null,
            ]);

            return [
                'success' => false,
                'error' => 'Webhook request failed: ' . $e->getMessage(),
                'url' => $url,
                'payload' => $payload,
                'method' => $method,
            ];

        } catch (\Exception $e) {
            Log::error('Webhook sending failed', [
                'url' => $url,
                'method' => $method,
                'error' => $e->getMessage(),
                'organization_id' => $bundle->integration->organization_id ?? null,
            ]);

            return [
                'success' => false,
                'error' => 'Failed to send webhook: ' . $e->getMessage(),
                'url' => $url,
                'method' => $method,
            ];
        }
    }
}
