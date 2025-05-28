<?php

namespace App\Modules\Integrations\Contracts;

interface AcceptsDiscount
{
    public function getDiscount(string $code);
}
