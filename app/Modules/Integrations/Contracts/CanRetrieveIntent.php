<?php

namespace App\Modules\Integrations\Contracts;

interface CanRetrieveIntent
{
    /**
     * Retrieve an intent by ID and type (payment or setup)
     */
    public function retrieveIntent(string $intentId, string $intentType);
} 