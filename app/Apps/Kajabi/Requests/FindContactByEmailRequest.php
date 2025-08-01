<?php

namespace App\Apps\Kajabi\Requests;

use Saloon\Enums\Method;
use Saloon\Http\Request;

class FindContactByEmailRequest extends Request
{
    protected Method $method = Method::GET;

    public function __construct(
        protected string $email,
        protected ?string $siteId = null
    ) {}

    public function resolveEndpoint(): string
    {
        return 'contacts';
    }

    protected function defaultQuery(): array
    {
        $query = [
            'filter[search]' => $this->email,
        ];

        if ($this->siteId) {
            $query['filter[site_id]'] = $this->siteId;
        }

        return $query;
    }
}
