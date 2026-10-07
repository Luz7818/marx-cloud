/**
 * 语录批次合并工具(数据扩充流水线专用,不进构建)。
 * 把 data/quotes-src/ 下全部 quotes-*.ndjson 追加到 src/data/quotes.js 末尾(在结尾的 ]; 之前插入)。
 * 用法:node tools/merge.mjs [--dry]
 *   --dry  只预览将追加的条数,不写文件。
 * 幂等性:以「文件行」为幂等键已由 selfcheck 保证(与库内不重复),本脚本只在
 * quotes.js 中找不到任何批内首条语录时执行插入,重复运行安全。
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const quotesSrc = join(root, 'data', 'quotes-src');
const dry = process.argv.includes('--dry');

const { quotes } = await import('file://' + join(root, 'src/data/quotes.js').replace(/\\/g, '/'));
const { figures } = await import('file://' + join(root, 'src/data/figures.js').replace(/\\/g, '/'));
const validIds = new Set(figures.map(f => f.id));

const files = readdirSync(quotesSrc).filter(f => f.endsWith('.ndjson')).sort();
const existing = new Set(quotes.map(q => q.f + '|' + q.t.replace(/\s+/g, '')));
const seen = new Set();
const out = [];
let skipped = 0;

for (const file of files) {
    const lines = readFileSync(join(quotesSrc, file), 'utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    const at = `${file}:${i + 1}`;
    let o;
    try { o = JSON.parse(raw); } catch { console.error(`${at} JSON解析失败(先跑 selfcheck)`); process.exit(2); }
    if (!validIds.has(o.f)) { console.error(`${at} 非法人物id "${o.f}"`); process.exit(2); }
    const key = o.f + '|' + String(o.t).replace(/\s+/g, '');
    if (seen.has(key) || existing.has(key)) { skipped++; continue; }
    seen.add(key);
    out.push(o);
  }
}

const sq = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
const rendered = out.map(o => `  { f: ${sq(o.f)}, w: ${sq(o.w)}, y: ${o.y === null ? 'null' : o.y}, t: ${sq(o.t)} },`);

console.log(`批次文件 ${files.length} 个,可追加 ${out.length} 条,跳过重复 ${skipped} 条;追加后总数 ${quotes.length + out.length}`);

if (!out.length) { console.log('没有可追加的语录,结束。'); process.exit(0); }
if (dry) { console.log('(--dry 预览,未写入)'); process.exit(0); }

const qp = join(root, 'src', 'data', 'quotes.js');
const src = readFileSync(qp, 'utf8');
const idx = src.lastIndexOf('];');
if (idx === -1) { console.error('quotes.js 结尾未找到 ];'); process.exit(2); }
let head = src.slice(0, idx).replace(/\s*$/, '');
if (!head.endsWith(',')) head += ',';
head += '\n';
const body = rendered.join('\n') + '\n';
writeFileSync(qp, head + body + '];\n');
console.log(`已写入 ${qp}(+${out.length} 条)`);
