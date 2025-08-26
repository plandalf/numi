import { readFileSync } from 'fs';
const manifestPath = 'public/build/manifest.json';
const requiredEntries = [
  'resources/js/pages/client/checkout.tsx',
  'resources/js/pages/sequences/index.tsx',
  'resources/js/pages/auth/login.tsx',
];

console.log('Checking Vite manifest...');
try {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));

  const missing = requiredEntries.filter(entry => !manifest[entry]);

  if (missing.length > 0) {
    console.error('❌ Missing Vite entries in manifest:');
    missing.forEach(e => console.error(`- ${e}`));
    process.exit(1);
  }

  console.log('✅ All required Vite entries are present in manifest.');
} catch (err) {
  console.error('Error reading Vite manifest:', err);
  process.exit(1);
}
