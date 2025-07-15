<?php

namespace App\Apps\Kajabi\Requests;

use Sammyjo20\Saloon\Http\Request;
use Sammyjo20\Saloon\Traits\Plugins\AcceptsJson;

class GetOffersRequest extends Request
{
    use AcceptsJson;

    protected ?string $method = 'GET';

    public function __construct(
        protected array $query = []
    ) {}

    public function defineEndpoint(): string
    {
        $endpoint = '/offers';
        
        if (isset($this->query['id'])) {
            $endpoint .= '/' . $this->query['id'];
        }
        
        return $endpoint;
    }

    public function defaultQuery(): array
    {
        return array_filter($this->query, function ($value) {
            return $value !== null;
        });
    }
} 