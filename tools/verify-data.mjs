/**
 * 数据契约校验(零依赖,退出码 0=通过 / 1=违反)。
 * 把 AGENTS.md「关键约定 1/2/6」与 portraits 清单变成可跑断言:
 *   [1] quotes[].f 必须是 figures[].id,且每位人物至少 1 条语录;
 *   [2] figures[].group 必须落在 groups 的 4 个 key 内,id 不重复;
 *   [3] index.html 中 getElementById 依赖的 id 必须存在;
 *   [4] PORTRAIT_PLANES 引用的人物必须存在;
 *   [5] quotes.t 无全角逗号 U+FF0C、无批内重复(f+t);
 *   [6] src/data/portraits.js 清单中的文件必须真实存在于 public/。
 * 运行:npm run verify(即 node tools/verify-data.mjs)
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const warn = [];

const { quotes } = await import('file://' + join(root, 'src/data/quotes.js').replace(/\\/g, '/'));
const { figures, figureMap, groups } = await import('file://' + join(root, 'src/data/figures.js').replace(/\\/g, '/'));

// [1] 语录 → 人物
const counts = {};
for (let i = 0; i < quotes.length; i++) {
  const q = quotes[i];
  if (!figureMap[q.f]) errors.push(`quotes[${i}].f "${q.f}" 不在 figures 中`);
  counts[q.f] = (counts[q.f] || 0) + 1;
}
for (const f of figures) {
  if (!counts[f.id]) errors.push(`人物 "${f.id}" 没有任何语录(会按权重 1 分到星点并兜底第 1 句)`);
}

// [2] 人物分组与 id
const gkeys = new Set(groups.map(g => g.key));
const ids = new Set();
for (const f of figures) {
  if (ids.has(f.id)) errors.push(`figures 中 id 重复: "${f.id}"`);
  ids.add(f.id);
  if (!gkeys.has(f.group)) errors.push(`figures[${f.id}].group "${f.group}" 不在 4 个 key 内(会让 boot() 抛 TypeError)`);
}

// [3] index.html 的 DOM id(main.js getElementById 依赖)
const html = readFileSync(join(root, 'index.html'), 'utf8');
const htmlIds = new Set([...html.matchAll(/id="([a-z0-9-]+)"/g)].map(m => m[1]));
const mainSrc = readFileSync(join(root, 'src/main.js'), 'utf8');
const needed = [...mainSrc.matchAll(/getElementById\('([a-z0-9-]+)'\)/g)].map(m => m[1]);
for (const id of needed) {
  if (!htmlIds.has(id)) errors.push(`index.html 缺少 main.js 依赖的 id "${id}"`);
}

// [4] 肖像平面人物存在
const planeIds = [...mainSrc.matchAll(/\{ id: '([a-z0-9-]+)', v: \d+ \}/g)].map(m => m[1]);
for (const id of planeIds) {
  if (!ids.has(id)) errors.push(`PORTRAIT_PLANES 引用了不存在的人物 "${id}"`);
}

// [5] 文本约定
let dup = 0;
const seen = new Set();
for (let i = 0; i < quotes.length; i++) {
  const t = quotes[i].t;
  if (typeof t !== 'string' || !t.trim()) errors.push(`quotes[${i}].t 为空`);
  if (t && t.includes('\uFF0C')) { errors.push(`quotes[${i}].t 含全角逗号 U+FF0C`); }
  const key = quotes[i].f + '|' + t.replace(/\s+/g, '');
  if (seen.has(key)) dup++;
  seen.add(key);
}
if (dup) errors.push(`发现 ${dup} 条重复语录(同人物同文本)`);

// [6] portraits 清单与文件一致性
const pFile = join(root, 'src/data/portraits.js');
if (existsSync(pFile)) {
  const { portraits } = await import('file://' + pFile.replace(/\\/g, '/'));
  for (const [id, p] of Object.entries(portraits)) {
    if (!ids.has(id)) errors.push(`portraits 清单引用了不存在的人物 "${id}"`);
    for (const key of ['ava', 'mask']) {
      const rel = p[key];
      if (rel && !existsSync(join(root, 'public', rel))) errors.push(`portraits["${id}"].${key} 指向的 public/${rel} 不存在`);
    }
  }
  for (const f of figures) {
    if ((f.wiki || f.id === 'marx' || f.id === 'engels' || f.id === 'lenin' || f.id === 'luxemburg') && !portraits[f.id]) {
      warn.push(`人物 "${f.id}" 无 portraits 清单项(侧栏将显示徽记而非头像)`);
    }
  }
} else {
  warn.push('src/data/portraits.js 不存在(尚未生成头像清单)');
}

if (warn.length) console.log('提醒:');
for (const w of warn) console.log('  - ' + w);
if (errors.length) {
  console.error(`\n数据契约校验失败,共 ${errors.length} 个问题:`);
  for (const e of errors) console.error('  × ' + e);
  process.exit(1);
} else {
  console.log(`数据契约校验通过:${figures.length} 位人物 / ${quotes.length} 条语录 / ${groups.length} 个分组 / 肖像平面 ${planeIds.length} 块`);
}
