<?php

namespace App\Modules\Integrations;

use App\Models\Catalog\Product;
use App\Models\Integration;

abstract class AbstractIntegration
{
    public function __construct(protected Integration $integration) {}

    abstract public function importProduct(array $attrs = []): ?Product;
}
