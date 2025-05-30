import '../css/app.css';
import '../css/nprogress.css';
import NProgress from 'nprogress';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from './components/ui/sonner';
import { initFlashMessages } from './lib/notifications';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Configure NProgress
NProgress.configure({
    showSpinner: false,
    trickleSpeed: 200,
    minimum: 0.1,
    easing: 'ease',
    speed: 500,
});

// Add event listeners for Inertia navigation
router.on('start', () => {
    NProgress.start();
});

router.on('progress', (event: any) => {
    if (event?.detail?.progress?.percentage) {
        NProgress.set((event.detail.progress.percentage / 100) * 0.9);
    }
});

router.on('finish', () => {
    NProgress.done(true); // Force complete the progress
});

router.on('invalid', () => {
    NProgress.done(true); // Also complete on invalid requests
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <Toaster position="top-center" closeButton richColors />
            </>
        );
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Initialize flash message handling
initFlashMessages();
