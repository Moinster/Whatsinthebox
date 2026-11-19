// Builds the installable web app (PWA) into dist/.
//
// Runs the Expo web export, then adds what a static host needs on top:
//  - the manifest link and service worker registration in index.html
//  - a service worker that precaches every built file, so the app opens offline
//  - 404.html, so deep links work on hosts without rewrite rules (GitHub Pages)
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';

execSync('npx expo export --platform web --output-dir ' + DIST, { stdio: 'inherit' });

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

// index.html: the app may be served from a sub-path (GitHub Pages), so reuse the prefix the export gave its scripts.
const indexPath = join(DIST, 'index.html');
let html = readFileSync(indexPath, 'utf8');
const base = (/<script src="([^"]*?)\/?_expo\//.exec(html)?.[1] ?? '') + '/';
html = html.replace(
  '</head>',
  `  <link rel="manifest" href="${base}manifest.json" />
    <meta name="theme-color" content="#F6F1EA" />
    <link rel="apple-touch-icon" href="${base}icon-192.png" />
    <script>
      if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () { navigator.serviceWorker.register('${base}sw.js'); });
      }
    </script>
  </head>`,
);
writeFileSync(indexPath, html);
copyFileSync(indexPath, join(DIST, '404.html'));

const files = walk(DIST)
  .map((path) => relative(DIST, path).split('\\').join('/'))
  .filter((path) => !['sw.js', '404.html', 'metadata.json'].includes(path));
const version = createHash('sha1');
for (const file of files) version.update(file).update(readFileSync(join(DIST, file)));

const sw = readFileSync('scripts/sw-template.js', 'utf8')
  .replace('__VERSION__', version.digest('hex').slice(0, 12))
  .replace('__FILES__', JSON.stringify(files.map((f) => (f === 'index.html' ? './' : f))));
writeFileSync(join(DIST, 'sw.js'), sw);

console.log(`\nPWA ready in ${DIST}/ (${files.length} files precached, base path "${base}")`);
