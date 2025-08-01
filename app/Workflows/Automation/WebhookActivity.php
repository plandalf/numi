<?php

namespace App\Workflows\Automation;

use App\Models\Automation\Action;
use App\Models\ResourceEvent;
use App\Workflows\Automation\Attributes\Activity;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Workflow\Activity as WorkflowActivity;

#[Activity(
    type: 'webhook',
    name: 'Webhook Request',
    description: 'Makes an HTTP request to an external API',
)]
class WebhookActivity extends WorkflowActivity
{
    public function execute(Action $node, ResourceEvent $event)
    {
        $url = TemplateResolver::get($event, Arr::get($node->arguments, 'url'));
        $method = TemplateResolver::get($event, Arr::get($node->arguments, 'method', 'POST'));
        $query = TemplateResolver::get($event, Arr::get($node->arguments, 'query_params', []));
        $headers = TemplateResolver::get($event, Arr::get($node->arguments, 'headers', []));
        $body = TemplateResolver::get($event, Arr::get($node->arguments, 'body', []));
        $timeout = TemplateResolver::get($event, Arr::get($node->arguments, 'timeout', 30));
        $verifySsl = TemplateResolver::get($event, Arr::get($node->arguments, 'verify_ssl', true));

        if (empty($url)) {
            logger()->error('Webhook activity missing URL');

            return [
                'error' => 'Missing URL',
                'status' => 400,
            ];
        }

        try {
            $request = Http::withHeaders($headers)
                ->timeout($timeout);

            if (! $verifySsl) {
                $request->withoutVerifying();
            }

            $response = $request->{$method}($url, $method === 'get' ? $query : $body);

            return [
                'status' => $response->status(),
                'body' => $response->json() ?? $response->body(),
                'headers' => $response->headers(),
                'success' => $response->successful(),
            ];
        } catch (\Exception $e) {
            logger()->error('Webhook request failed', [
                'error' => $e->getMessage(),
                'url' => $url,
            ]);

            return [
                'error' => $e->getMessage(),
                'status' => 0,
                'success' => false,
            ];
        }
    }
}
