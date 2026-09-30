/** 临时统计脚本:每人物语录条数分布 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const { quotes } = await import('file://' + join(root, 'src/data/quotes.js').replace(/\\/g, '/'));
const { figures } = await import('file://' + join(root, 'src/data/figures.js').replace(/\\/g, '/'));

const cnt = {};
for (const q of quotes) cnt[q.f] = (cnt[q.f] || 0) + 1;
console.log('=== 全部人物(id | 名字 | 现有条数) ===');
for (const f of figures) console.log(`${f.id.padEnd(18)} ${f.name}  ${cnt[f.id] || 0}`);
const missing = figures.filter(f => !cnt[f.id]);
console.log('无语录人物数:', missing.length, missing.map(f => f.id).join(','));
console.log('总计:', quotes.length);
