<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class NoAccessController extends Controller
{
    public function __invoke(Request $request)
    {
        $organization = $request->user()->currentOrganization;
        if($organization->subscribed) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('no-access/index');
    }
}
