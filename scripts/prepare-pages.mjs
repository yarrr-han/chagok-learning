// Keep branch-based GitHub Pages working while retaining editable source in src/.
// Old assets remain available for visitors with a cached index.html.
import { cpSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
if (!existsSync(join(dist, 'index.html'))) throw new Error('Run npm run build first');
cpSync(join(dist, 'assets'), join(root, 'assets'), { recursive: true });
cpSync(join(dist, 'index.html'), join(root, 'index.html'));
cpSync(join(dist, '.nojekyll'), join(root, '.nojekyll'));
console.log('Prepared root index.html and assets/ for branch-based GitHub Pages.');
