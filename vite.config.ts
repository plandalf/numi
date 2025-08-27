import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import fs from 'fs'
import path from 'path'

export default defineConfig({
    plugins: [
        laravel({
            input: [
              'resources/css/app.css',
              'resources/js/app.tsx',
              'resources/js/client.tsx',
              'resources/js/pages/sequences/index.tsx',
              'resources/js/pages/client/checkout.tsx',
              ...getPageEntries()
            ],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});

function getPageEntries() {
  const dir = path.resolve(__dirname, 'resources/js/pages')
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.tsx'))
    .map(file => `resources/js/pages/${file}`)
}
