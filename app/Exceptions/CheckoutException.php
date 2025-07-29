<?php

namespace App\Exceptions;

class CheckoutException extends \Exception
{
    public string $type = 'unknown_error';

    public static function message(string $string): self
    {
        $exception = new self($string);
        $exception->type = 'checkout_error';
        return $exception;
    }
}
