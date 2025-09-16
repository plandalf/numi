<?php

declare(strict_types=1);

namespace App\ValueObjects;

final class JwtCustomerContext
{
    public function __construct(
        public readonly ?string $stripeCustomerId = null,
        public readonly ?string $userId = null,
        public readonly ?string $groupId = null,
        public readonly ?string $subscriptionId = null,
        /** @var array{email?:string,name?:string} */
        public readonly array $customerProperties = [],
    ) {}

    /**
     * @return array{jwt: array<string, string>}
     */
    public function toMetadataFragment(): array
    {
        $jwt = array_filter([
            'customer_id' => $this->stripeCustomerId,
            'sub' => $this->userId,
            'grp' => $this->groupId,
            'subscription_id' => $this->subscriptionId,
        ], fn ($v) => !is_null($v));

        return ['jwt' => $jwt];
    }
}


