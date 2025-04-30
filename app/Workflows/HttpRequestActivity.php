<?php

namespace App\Workflows;

use Workflow\Activity;

class HttpRequestActivity extends Activity
{
    public function execute(
        string $url,
        string $method = 'GET', // one of GET, POST, PUT, DELETE
        array $body = [],
        array $headers = []
    ) {
        logger()->info('HttpRequestActivity::execute', ['url' => $url, 'method' => $method, 'data' => $data]);

        // Perform the HTTP request here using Guzzle or any other HTTP client
        // For example:
        // $response = Http::withHeaders(['Authorization' => 'Bearer token'])->$method($url, $data);

        return 'Response from '.$url;
    }
}
