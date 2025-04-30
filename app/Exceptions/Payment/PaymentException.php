<?php

namespace App\Exceptions\Payment;

use Exception;

class PaymentException extends Exception
{
    protected string $errorType;

    protected ?array $errorDetails;

    /**
     * Create a new payment exception instance.
     */
    public function __construct(
        string $message,
        string $errorType,
        ?array $errorDetails = null,
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $code, $previous);
        $this->errorType = $errorType;
        $this->errorDetails = $errorDetails;
    }

    /**
     * Get the error type.
     */
    public function getErrorType(): string
    {
        return $this->errorType;
    }

    /**
     * Get the error details.
     */
    public function getErrorDetails(): ?array
    {
        return $this->errorDetails;
    }
}
