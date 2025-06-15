<?php

namespace App\Services;

use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class JavaScriptExecutionService
{
    private string $executorPath;
    private int $timeoutSeconds;

    public function __construct()
    {
        $this->executorPath = base_path('scripts/js-executor-secure.js');
        $this->timeoutSeconds = 60; // Match the process timeout
        
        $this->ensureExecutorExists();
    }

    /**
     * Execute JavaScript code using the secure Node.js executor
     */
    public function execute(string $code, array $context = []): array
    {
        // Basic input validation
        if (empty($code)) {
            return [
                'success' => false,
                'error' => [
                    'message' => 'Code cannot be empty',
                    'stack' => null
                ]
            ];
        }

        if (strlen($code) > 100000) {
            return [
                'success' => false,
                'error' => [
                    'message' => 'Code too large (max 100KB)',
                    'stack' => null
                ]
            ];
        }

        try {
            // Prepare input data for the secure executor
            $input = json_encode([
                'code' => $code,
                'context' => $context
            ], JSON_UNESCAPED_SLASHES);

            // Create process to run the secure executor
            $process = new Process([
                'node',
                $this->executorPath
            ], base_path('scripts'), null, $input, $this->timeoutSeconds);

            $process->run();

            if (!$process->isSuccessful()) {
                // Try to parse error output as JSON first
                $errorOutput = $process->getOutput() ?: $process->getErrorOutput();
                
                if ($errorOutput) {
                    $decodedError = json_decode($errorOutput, true);
                    if ($decodedError && isset($decodedError['error'])) {
                        return $decodedError;
                    }
                }

                // Fallback to process exception
                throw new ProcessFailedException($process);
            }

            $output = $process->getOutput();
            $result = json_decode($output, true);

            if (json_last_error() !== JSON_ERROR_NONE) {
                return [
                    'success' => false,
                    'error' => [
                        'message' => 'Invalid JSON response from executor: ' . json_last_error_msg(),
                        'stack' => null
                    ]
                ];
            }

            return $result;

        } catch (ProcessFailedException $e) {
            return [
                'success' => false,
                'error' => [
                    'message' => 'Process execution failed: ' . $e->getMessage(),
                    'stack' => null
                ]
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => [
                    'message' => $e->getMessage(),
                    'stack' => $e->getTraceAsString()
                ]
            ];
        }
    }

    /**
     * Ensure the executor script exists and dependencies are installed
     */
    private function ensureExecutorExists(): void
    {
        if (!file_exists($this->executorPath)) {
            throw new \Exception('JavaScript executor not found at: ' . $this->executorPath);
        }

        // Check if dependencies are installed
        $scriptsDir = dirname($this->executorPath);
        $nodeModulesPath = $scriptsDir . '/node_modules';
        
        if (!file_exists($nodeModulesPath)) {
            $this->installExecutorDependencies();
        }
    }

    /**
     * Install dependencies for the executor
     */
    private function installExecutorDependencies(): void
    {
        $scriptsDir = dirname($this->executorPath);
        
        $process = new Process(['npm', 'install'], $scriptsDir, null, null, 120);
        $process->run();

        if (!$process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }
    }

    /**
     * Check if the executor is ready to use
     */
    public function isReady(): bool
    {
        try {
            $this->ensureExecutorExists();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get information about the execution environment
     */
    public function getEnvironmentInfo(): array
    {
        return [
            'executor_path' => $this->executorPath,
            'timeout_seconds' => $this->timeoutSeconds,
            'ready' => $this->isReady(),
            'node_modules_exists' => file_exists(dirname($this->executorPath) . '/node_modules'),
            'security_features' => [
                'worker_thread_isolation' => true,
                'pattern_detection' => true,
                'resource_limits' => true,
                'domain_allowlisting' => true,
                'memory_limit_mb' => 96,
                'execution_timeout_seconds' => 30,
                'network_timeout_seconds' => 10
            ]
        ];
    }

    /**
     * Get list of allowed domains for fetch requests
     */
    public function getAllowedDomains(): array
    {
        return [
            'jsonplaceholder.typicode.com',
            'api.stripe.com',
            'httpbin.org',
            'reqres.in',
            'postman-echo.com'
        ];
    }

    /**
     * Get available globals in the execution environment
     */
    public function getAvailableGlobals(): array
    {
        return [
            'http' => ['fetch', 'safeFetch'],
            'stripe' => ['createStripe'],
            'json' => ['JSON_UTILS.pretty', 'JSON_UTILS.minify', 'JSON_UTILS.parse', 'JSON_UTILS.stringify'],
            'context' => ['context'],
            'console' => ['console.log', 'console.error', 'console.warn', 'console.info'],
            'javascript' => ['JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Error', 'Promise']
        ];
    }
} 