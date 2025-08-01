<?php

namespace App\Apps\Kajabi\Requests;

use Saloon\Enums\Method;
use Saloon\Http\Request;

class FindTagByNameRequest extends Request
{
    protected Method $method = Method::GET;

    public function __construct(
        protected string $tagName,
        protected ?string $siteId = null
    ) {}

    public function resolveEndpoint(): string
    {
        return 'contact_tags';
    }

    protected function defaultQuery(): array
    {
        $query = [
            'filter[name]' => $this->tagName,
        ];

        if ($this->siteId) {
            $query['filter[site_id]'] = $this->siteId;
        }

        return $query;
    }
}