<?php

namespace App\Http\Controllers;

use Inertia\Inertia;

class NoAccessController extends Controller
{
    public function __invoke()
    {
        return Inertia::render('no-access/index');
    }
}
