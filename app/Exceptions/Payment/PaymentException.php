<?php

namespace App\Exceptions\Payment;

use Exception;

class PaymentException extends Exception
{
    protected string $errorType;
    protected ?array $errorDetails;

    /**
     * Create a new payment exception instance.
     *
     * @param string $message
     * @param string $errorType
     * @param array|null $errorDetails
     * @param int $code
     * @param \Throwable|null $previous
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
     *
     * @return string
     */
    public function getErrorType(): string
    {
        return $this->errorType;
    }

    /**
     * Get the error details.
     *
     * @return array|null
     */
    public function getErrorDetails(): ?array
    {
        return $this->errorDetails;
    }
}
