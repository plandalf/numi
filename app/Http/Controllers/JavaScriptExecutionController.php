<?php

namespace App\Http\Controllers;

use App\Services\JavaScriptExecutionService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class JavaScriptExecutionController extends Controller
{
    public function __construct(
        private JavaScriptExecutionService $jsExecutionService
    ) {}

    /**
     * Show the JavaScript execution test page
     */
    public function test(): Response
    {
        return Inertia::render('JavaScriptExecution/Test', [
            'environmentInfo' => $this->jsExecutionService->getEnvironmentInfo(),
            'allowedDomains' => $this->jsExecutionService->getAllowedDomains(),
            'availableGlobals' => $this->jsExecutionService->getAvailableGlobals(),
        ]);
    }

    /**
     * Execute JavaScript code via API
     */
    public function execute(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:100000',
            'context' => 'sometimes|array'
        ]);

        $jsCode = $request->input('code');
        $context = $request->input('context', []);

        // Execute the code using the secure executor
        // All security validation is handled by the executor itself
        $result = $this->jsExecutionService->execute($jsCode, $context);
        
        // Return appropriate HTTP status based on success
        $statusCode = $result['success'] ? 200 : 400;
        
        return response()->json($result, $statusCode);
    }
} 