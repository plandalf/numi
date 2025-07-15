<?php

namespace App\Apps\Kajabi\Requests;

use Saloon\Enums\Method;
use Saloon\Http\Request;

class GetTagsRequest extends Request
{
    protected Method $method = Method::GET;

    public function resolveEndpoint(): string
    {
        return '/contact_tags';
    }

    protected function defaultQuery(): array
    {
        return [
//            'sort' => 'name', // ?sort=name
//            'filter[active]' => 'true', // ?filter[active]=true
        ];
    }
}
