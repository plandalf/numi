<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{-- Critical CSS to prevent FOUC --}}
        <style>
            /* Prevent flash of unstyled content */
            html, body {
                background-color: oklch(1 0 0);
                color: oklch(0.145 0 0);
                font-family: 'Instrument Sans', ui-sans-serif, system-ui, sans-serif;
                font-feature-settings: normal;
                font-variation-settings: normal;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            /* Hide content until fonts and styles are loaded */
            .font-loading {
                visibility: hidden;
            }

            /* Show content when ready */
            .fonts-loaded {
                visibility: visible;
            }
        </style>


        <title inertia>{{ config('app.name', 'Plandalf') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link rel="preload" as="style" href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600">
        <link rel="preload" as="style" href="https://fonts.bunny.net/css?family=sora:800">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" media="print" onload="this.media='all'" />
        <link href="https://fonts.bunny.net/css?family=sora:800" rel="stylesheet" media="print" onload="this.media='all'" />
        <noscript>
            <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            <link href="https://fonts.bunny.net/css?family=sora:800" rel="stylesheet" />
        </noscript>

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
    <body class="font-sans antialiased font-loading">
        @inertia

        <script>
            // Mark fonts as loaded when they're ready
            document.fonts.ready.then(function() {
                document.body.classList.remove('font-loading');
                document.body.classList.add('fonts-loaded');
            });

            // Fallback in case fonts don't load
            setTimeout(function() {
                document.body.classList.remove('font-loading');
                document.body.classList.add('fonts-loaded');
            }, 3000);
        </script>
    </body>
</html>
