<?php

namespace App\Apps\Kajabi\Requests;

use Saloon\Contracts\Body\HasBody;
use Saloon\Enums\Method;
use Saloon\Http\Request;
use Saloon\Traits\Body\HasJsonBody;

class AddTagsToContactRequest extends Request implements HasBody
{
    use HasJsonBody;

    protected Method $method = Method::POST;

    public function __construct(
        protected string $contactId,
        protected array $tagIds
    ) {}

    public function resolveEndpoint(): string
    {
        return "contacts/{$this->contactId}/relationships/tags";
    }

    protected function defaultBody(): array
    {
        return [
            'data' => array_map(fn($tagId) => [
                'type' => 'contact_tags',
                'id' => $tagId,
            ], $this->tagIds),
        ];
    }
}