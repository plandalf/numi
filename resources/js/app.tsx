import '../css/app.css';
import '../css/nprogress.css';
import NProgress from 'nprogress';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { hydrateRoot } from 'react-dom/client';
import { Toaster } from './components/ui/sonner';

import { initFlashMessages } from './lib/notifications';
import { configureEcho } from '@laravel/echo-react';

configureEcho({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: true,
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
    },
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Configure NProgress
NProgress.configure({
    showSpinner: false,
    trickleSpeed: 400, // Slower trickle speed
    minimum: 0.2, // Start at 20%
    easing: 'ease',
    speed: 800, // Slower animation
});

let timeout: NodeJS.Timeout | null = null;

// Add event listeners for Inertia navigation
router.on('start', (e) => {
    // Clear any existing timeout
    if (timeout) {
        clearTimeout(timeout);
        timeout = null;
    }
    NProgress.start();
});

router.on('progress', (event: unknown) => {
    const progressEvent = event as { detail?: { progress?: { percentage?: number } } };
    if (progressEvent?.detail?.progress?.percentage) {
        const progress = Math.min((progressEvent.detail.progress.percentage / 100) * 0.9, 0.9);
        NProgress.set(progress);
    }
});

router.on('finish', () => {
    // Delay the completion slightly to ensure smooth transition
    timeout = setTimeout(() => {
        NProgress.done(true);
        timeout = null;
    }, 250);
});

router.on('invalid', () => {
    if (timeout) {
        clearTimeout(timeout);
        timeout = null;
    }
    NProgress.done(true);
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx', { eager: true })),
    setup({ el, App, props }) {
        hydrateRoot(
            el,
            <>
                <App {...props} />
                <Toaster position="top-center" closeButton richColors />
            </>,
        );
    },
});

// Initialize flash message handling
initFlashMessages();
