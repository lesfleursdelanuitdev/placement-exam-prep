// Pulls single definitions out of src/app.js by name, so a test can run app.js's own exam model
// (which lives inside the page's IIFE and can't be imported) beside web/engine/model.mjs.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const APP_JS = readFileSync(join(root, 'src/app.js'), 'utf8');

// `function name(...) { ... }`, matched brace to brace (strings, templates and comments skipped)
export function fnSource(name, src = APP_JS) {
  const at = src.search(new RegExp(`\\n\\s*function ${name}\\(`));
  if (at < 0) throw new Error(`src/app.js has no function ${name}: carry the change into web/engine/model.mjs`);
  let i = src.indexOf('{', src.indexOf(`function ${name}(`, at));
  let depth = 0;
  const stack = []; // open template literals, by the brace depth they were opened at
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { i = src.indexOf('\n', i); continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 1; continue; }
    if (c === "'" || c === '"') { for (i++; src[i] !== c; i++) if (src[i] === '\\') i++; continue; }
    if (c === '`' || (c === '}' && stack.length && stack[stack.length - 1] === depth)) {
      if (c === '}') { stack.pop(); depth--; }
      for (i++; i < src.length; i++) {
        if (src[i] === '\\') { i++; continue; }
        if (src[i] === '`') break;
        if (src[i] === '$' && src[i + 1] === '{') { i++; depth++; stack.push(depth); break; }
      }
      continue;
    }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return src.slice(src.indexOf(`function ${name}(`, at), i + 1);
  }
  throw new Error(`could not find the end of function ${name} in src/app.js`);
}

// `const name = ...;` on one line
export function constSource(name, src = APP_JS) {
  const m = new RegExp(`\\n\\s*(const ${name} = [^\\n]*;)\\s*(//[^\\n]*)?\\n`).exec(src);
  if (!m) throw new Error(`src/app.js has no one-line const ${name}: carry the change into web/engine/model.mjs`);
  return m[1];
}

// a line that starts with `text`
export function lineStarting(text, src = APP_JS) {
  const line = src.split('\n').map((l) => l.trim()).find((l) => l.startsWith(text));
  if (!line) throw new Error(`src/app.js has no line starting ${JSON.stringify(text)}`);
  return line;
}
