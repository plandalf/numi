<?php

namespace App\Traits;

use App\Models\Organization;
use League\Uri\Http;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

trait HandlesLandingPageDomains
{
    protected function handleInvalidDomain(
        Request $request,
        $model,
    ) {
        $url = Http::new($request->getUri());
        $currentHost = $request->getHost();
        $port = $request->getPort();

        /** @var Organization $org */
        $org = $model->organization;
        $domain = $org->getSubdomainHost();

        if ($currentHost !== $domain && !empty($domain)) {
            // Create new URL with updated host
            $newUrl = $url->withHost($domain);

            // Only set port if it's non-standard
            if ($port && $port != 80 && $port != 443) {
                $newUrl = $newUrl->withPort($port);
            }

            redirect_now($newUrl);
        }
    }
}
