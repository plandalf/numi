import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { hydrateRoot } from 'react-dom/client';
import { Toaster } from '@/components/ui/sonner';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
  title: (title) => `${title} - ${appName}`,
  resolve: (name) => resolvePageComponent(
    `./pages/${name}.tsx`,
    import.meta.glob('./pages/client/**/*.tsx',{ eager: true })
  ),
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
