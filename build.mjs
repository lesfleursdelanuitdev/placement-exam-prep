// Build: bundles src/ into one self-contained page.
//   docs/index.html     full HTML document (open directly or serve with GitHub Pages from /docs)
//   dist/artifact.html  the same page as a body fragment (for hosts that supply <html>/<head>)
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const src = (p) => readFileSync(join(root, 'src', p), 'utf8');
const topics = readdirSync(join(root, 'src/topics')).filter((f) => f.endsWith('.js')).sort();
const order = ['core.js', 'texmath.js', 'parse.js', 'check.js', 'svg.js', 'helpers.js', 'verify.js', 'plot.js', ...topics.map((t) => 'topics/' + t), 'flashcards.js', 'editor.js', 'store.js', 'grapher.js', 'app.js'];

const js = order.map((f) => `/* ---- ${f} ---- */\n` + src(f)).join('\n').replace(/<\/script/gi, '<\\/script');
const css = src('styles.css');
const shell = src('shell.html');
const page = shell.replace('/*STYLES*/', () => css).replace('/*SCRIPT*/', () => js);

mkdirSync(join(root, 'dist'), { recursive: true });
mkdirSync(join(root, 'docs'), { recursive: true });
writeFileSync(join(root, 'dist/artifact.html'), page);

const cut = page.indexOf('</style>') + '</style>'.length;
const full = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  page.slice(0, cut) + '\n</head>\n<body>\n' + page.slice(cut) + '\n</body>\n</html>\n';
writeFileSync(join(root, 'docs/index.html'), full);
console.log(`built docs/index.html (${(full.length / 1024).toFixed(0)} KB) and dist/artifact.html`);
