/**
 * 语录批次自检(数据扩充流水线专用,不进构建)。
 * 用法:node tools/selfcheck.mjs <批次名>            # 校验 data/quotes-src/quotes-<批次名>*.ndjson
 *       node tools/selfcheck.mjs --all               # 校验 data/quotes-src/ 下全部 ndjson
 *       node tools/selfcheck.mjs --post              # 合并后自检:跳过「与现有语录库重复」检查
 * 检查:行可解析 / f 合法 / w 以《开头 / y 合法 / t 长度与禁用字符(全角逗号、半角双引号)/ 批内重复 / 与现有库重复。
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const quotesSrc = join(root, 'data', 'quotes-src');
const { quotes } = await import('file://' + join(root, 'src/data/quotes.js').replace(/\\/g, '/'));
const { figures } = await import('file://' + join(root, 'src/data/figures.js').replace(/\\/g, '/'));
const validIds = new Set(figures.map(f => f.id));

const args = process.argv.slice(2);
const post = args.includes('--post'); // 合并后自检:跳过「与现有语录库重复」检查(批次已在库内)
const argRaw = args.find(a => a !== '--post') || '--all';
const arg = argRaw;
const files = arg === '--all'
  ? readdirSync(quotesSrc).filter(f => f.endsWith('.ndjson'))
  : readdirSync(quotesSrc).filter(f => f.startsWith(`quotes-${arg}`) && f.endsWith('.ndjson'));
if (!files.length) { console.error(`找不到批次文件:quotes-${arg}*.ndjson`); process.exit(2); }

const existing = new Set(post ? [] : quotes.map(q => q.f + '|' + q.t.replace(/\s+/g, '')));
const seen = new Set();
let bad = 0, total = 0;
const perFig = {};

for (const file of files) {
  const lines = readFileSync(join(quotesSrc, file), 'utf8').split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].trim();
    if (!raw) continue;
    total++;
    const at = `${file}:${i + 1}`;
    let o;
    try { o = JSON.parse(raw); } catch (e) { console.log(`${at} JSON解析失败: ${e.message}`); bad++; continue; }
    const fail = (m) => { console.log(`${at} ${m}`); bad++; };
    if (!validIds.has(o.f)) fail(`非法人物id "${o.f}"(必须是 figures.js 中的 id)`);
    if (typeof o.w !== 'string' || !o.w.startsWith('《') || !o.w.endsWith('》')) fail(`w 字段应以《》包裹,得到 "${o.w}"`);
    if (!(o.y === null || (Number.isInteger(o.y) && o.y > 1400 && o.y < 2100))) fail(`y 应为年份整数或 null,得到 ${o.y}`);
    if (typeof o.t !== 'string' || o.t.length < 6 || o.t.length > 130) fail(`t 长度 ${o.t ? o.t.length : 0} 超出 6~130`);
    if (o.t && o.t.includes('\uFF0C')) fail('t 含全角逗号 U+FF0C,必须改为半角 ,');
    if (o.t && o.t.includes('"')) fail('t 含半角双引号,必须改为全角引号“”');
    if (o.t && o.t.includes('\u2014\u2014') === false && /——/.test(o.t) === false) { /* 破折号允许,不做检查 */ }
    const key = o.f + '|' + String(o.t || '').replace(/\s+/g, '');
    if (seen.has(key)) fail('批内重复');
    if (existing.has(key)) fail('与现有语录库重复(请换一条)');
    seen.add(key);
    perFig[o.f] = (perFig[o.f] || 0) + 1;
  }
}

console.log('---- 每人物条数 ----');
for (const [f, n] of Object.entries(perFig).sort((a, b) => a[0].localeCompare(b[0]))) console.log(`  ${f.padEnd(16)} ${n}`);
console.log(`共 ${total} 条,问题 ${bad} 个${bad ? '(需修复到 0)' : ' ✓'}`);
process.exit(bad ? 1 : 0);
