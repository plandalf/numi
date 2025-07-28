<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $execution_id
 * @property int $node_id
 * @property string|null $step_name
 * @property array|null $input_data
 * @property array|null $output_data
 * @property array|null $raw_response
 * @property array|null $processed_output
 * @property string $status
 * @property \Carbon\Carbon|null $started_at
 * @property \Carbon\Carbon|null $completed_at
 * @property int|null $duration_ms
 * @property int $retry_count
 * @property int $max_retries
 * @property string|null $error_message
 * @property string|null $error_code
 * @property array|null $debug_info
 * @property int|null $parent_step_id
 * @property int|null $loop_iteration
 * @property int|null $loop_action_index
 * @property string|null $action_group_type
 * @property int|null $action_group_iteration
 * @property int|null $action_group_index
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class WorkflowStep extends Model
{
    protected $fillable = [
        'execution_id',
        'node_id',
        'step_name',
        'input_data',
        'output_data',
        'raw_response',
        'processed_output',
        'status',
        'started_at',
        'completed_at',
        'duration_ms',
        'retry_count',
        'max_retries',
        'error_message',
        'error_code',
        'debug_info'
    ];
    
    protected $casts = [
        'input_data' => 'json',
        'output_data' => 'json',
        'raw_response' => 'json',
        'processed_output' => 'json',
        'debug_info' => 'json',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];
    
    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_RUNNING = 'running';
    const STATUS_COMPLETED = 'completed';
    const STATUS_FAILED = 'failed';
    const STATUS_SKIPPED = 'skipped';
    
    // Common error codes
    const ERROR_API_TIMEOUT = 'api_timeout';
    const ERROR_API_RATE_LIMIT = 'api_rate_limit';
    const ERROR_INVALID_CREDENTIALS = 'invalid_credentials';
    const ERROR_INVALID_CONFIG = 'invalid_config';
    const ERROR_EXTERNAL_SERVICE = 'external_service_error';
    const ERROR_VALIDATION = 'validation_error';
    
    // Helper methods
    public function shouldRetry(): bool
    {
        return $this->status === self::STATUS_FAILED && 
               $this->retry_count < $this->max_retries;
    }
    
    public function recordStart(): void
    {
        $this->update([
            'status' => self::STATUS_RUNNING,
            'started_at' => now(),
        ]);
    }
    
    public function recordSuccess(array $output, array $rawResponse = null): void
    {
        $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
            'duration_ms' => $this->started_at ? now()->diffInMilliseconds($this->started_at) : null,
            'output_data' => $output,
            'raw_response' => $rawResponse,
            'processed_output' => $this->processOutput($output),
        ]);
    }
    
    public function recordFailure(string $errorMessage, string $errorCode = null, array $debugInfo = null): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'completed_at' => now(),
            'duration_ms' => $this->started_at ? now()->diffInMilliseconds($this->started_at) : null,
            'error_message' => $errorMessage,
            'error_code' => $errorCode,
            'debug_info' => $debugInfo,
            'retry_count' => $this->retry_count + 1,
        ]);
    }
    
    private function processOutput(array $output): array
    {
        // Process output for template variables
        $processed = [];
        
        foreach ($output as $key => $value) {
            // Flatten nested arrays for easier templating
            if (is_array($value)) {
                $processed[$key] = $value;
                // Also create flattened keys for arrays
                if (array_is_list($value)) {
                    foreach ($value as $index => $item) {
                        if (is_array($item)) {
                            foreach ($item as $subKey => $subValue) {
                                $processed["{$key}[{$index}].{$subKey}"] = $subValue;
                            }
                        } else {
                            $processed["{$key}[{$index}]"] = $item;
                        }
                    }
                }
            } else {
                $processed[$key] = $value;
            }
        }
        
        return $processed;
    }
} 