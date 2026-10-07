/** 临时:批次+现有库 的每人物合并条数(最少的排前面) */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const quotesSrc = join(root, 'data', 'quotes-src');
const { quotes } = await import('file://' + join(root, 'src/data/quotes.js').replace(/\\/g, '/'));
const { figures } = await import('file://' + join(root, 'src/data/figures.js').replace(/\\/g, '/'));

const cnt = {};
for (const q of quotes) cnt[q.f] = (cnt[q.f] || 0) + 1;
for (const f of readdirSync(quotesSrc).filter(x => x.endsWith('.ndjson'))) {
  for (const line of readFileSync(join(quotesSrc, f), 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { const o = JSON.parse(line); cnt[o.f] = (cnt[o.f] || 0) + 1; } catch {}
  }
}
const rows = figures.map(f => [cnt[f.id] || 0, f.id, f.name]).sort((a, b) => a[0] - b[0]);
for (const [n, id, name] of rows) console.log(String(n).padStart(4), id.padEnd(16), name);
console.log('合计(现有+批次):', Object.entries(cnt).reduce((s, [, v]) => s + v, 0));
