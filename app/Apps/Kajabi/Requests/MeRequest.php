<?php

namespace App\Apps\Kajabi\Requests;

use Saloon\Enums\Method;
use Saloon\Http\Request;

class MeRequest extends Request
{
    protected Method $method = Method::GET;

    public function resolveEndpoint(): string
    {
        return 'me';
    }
}
