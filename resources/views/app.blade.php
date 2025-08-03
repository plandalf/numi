<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'Plandalf') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
        <link href="https://fonts.bunny.net/css?family=sora:800" rel="stylesheet" />
        
        {{-- Google Fonts preconnect for better performance --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        
        {{-- Custom fonts for checkout pages --}}
        @if(isset($page['props']['googleFontsUrl']) && $page['props']['googleFontsUrl'])
            <link rel="preload" as="style" href="{{ $page['props']['googleFontsUrl'] }}">
            <link rel="stylesheet" href="{{ $page['props']['googleFontsUrl'] }}" media="print" onload="this.media='all'">
            <noscript><link rel="stylesheet" href="{{ $page['props']['googleFontsUrl'] }}"></noscript>
        @endif

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia

    </body>
</html>
