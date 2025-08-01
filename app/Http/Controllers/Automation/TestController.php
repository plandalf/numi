<?php

declare(strict_types=1);

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TestController extends Controller
{
    /**
     * Test a morph action or trigger.
     */
    public function test(Request $request): Response
    {
        // TODO: Implement test logic
        return response()->noContent();
    }
} 