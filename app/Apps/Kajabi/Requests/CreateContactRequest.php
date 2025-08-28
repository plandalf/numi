<?php

namespace App\Apps\Kajabi\Requests;

use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Request;
use Saloon\Traits\Body\HasJsonBody;

class CreateContactRequest extends Request implements HasBody
{
    use HasJsonBody;

    protected Method $method = Method::POST;

    public function __construct(
        protected array $contactData,
        protected ?string $siteId = null
    ) {}

    public function resolveEndpoint(): string
    {
        return 'contacts';
    }

    protected function defaultBody(): array
    {
        $body = [
            'data' => [
                'type' => 'contacts',
                'attributes' => $this->contactData,
            ],
        ];

        if ($this->siteId) {
            $body['data']['relationships'] = [
                'site' => [
                    'data' => [
                        'type' => 'sites',
                        'id' => $this->siteId,
                    ],
                ],
            ];
        }

        return $body;
    }
}
