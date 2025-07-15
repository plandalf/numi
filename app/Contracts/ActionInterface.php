<?php

namespace App\Contracts;

use App\Models\WorkflowStep;

interface ActionInterface
{
    /**
     * Execute the action with real side effects
     */
    public function execute(array $input, WorkflowStep $step): array;

    /**
     * Execute the action in test mode - should actually run but mark as test
     */
    public function executeTest(array $input): array;
} 