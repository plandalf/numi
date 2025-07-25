<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class FrameEmbedMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Set security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Content-Security-Policy', "frame-ancestors *");
        
        // Allow payment permissions for self and Stripe domains
        // This is required for Stripe Elements to work properly in iframes
        $response->headers->set('Permissions-Policy', "payment=(self \"https://js.stripe.com\" \"https://api.stripe.com\" \"https://*.stripe.com\")");

        return $response;
    }
}
