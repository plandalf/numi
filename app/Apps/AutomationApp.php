<?php

namespace App\Apps;

abstract class AutomationApp
{
    /* @return array<string> */
    abstract public function actions(): array;

    /* @return array<string> */
    abstract public function triggers(): array;

    /* @return array<string> */
    public function resources(): array
    {
        return [];
    }
}
