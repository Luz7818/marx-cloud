/**
 * 生成标志视图用的徽章采样点位。
 *
 * 底图:tools/emblem-ref.png —— 中国共产党党徽(镰刀锤头)的标准图形,
 * 取自 Wikimedia Commons 的 CC0 栅格化件
 * "Hammer and Sickle based on the design provided by the Communist Party of China"。
 * 之前用解析本元手搓的几何把锤头/镰柄的朝向画反了,所以认不出来,现在直接描这张图。
 *
 * 取点偏重轮廓:粒子是加色发光的点,决定"认不认得出"的是描边而不是填充。
 * 顶端另加一颗五角星(党徽本体不含星,这里作点缀)。
 *
 * 用法:node tools/make-emblem.mjs [--n=3400]
 */
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const N = +(process.argv.find(a => a.startsWith('--n=')) || '').slice(4) || 3400;
const GRID = 460;          // 底图重采样分辨率
const EDGE_RATIO = 0.72;   // 落在轮廓上的点占比
const STAR_SHARE = 0.10;   // 五角星的点占比

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

// ---------- 底图 → 二值掩膜(与背景色不同的像素即图形) ----------
const src = PNG.sync.read(readFileSync(join(root, 'tools/emblem-ref.png')));
const SW = src.width, SH = src.height, SD = src.data;
const bgAt = (p) => [SD[p * 4], SD[p * 4 + 1], SD[p * 4 + 2]];
const bg0 = bgAt(0);

const cw = Math.round(SW / GRID), ch = Math.round(SH / GRID);
const mask = new Uint8Array(GRID * GRID);
let inside = 0;
for (let gy = 0; gy < GRID; gy++) {
  for (let gx = 0; gx < GRID; gx++) {
    let hit = 0, n = 0;
    for (let sy = gy * ch; sy < Math.min(SH, (gy + 1) * ch); sy += 2) {
      for (let sx = gx * cw; sx < Math.min(SW, (gx + 1) * cw); sx += 2) {
        const p = sy * SW + sx;
        const [r, g, b] = bgAt(p);
        const diff = Math.abs(r - bg0[0]) + Math.abs(g - bg0[1]) + Math.abs(b - bg0[2]);
        const opaque = SD[p * 4 + 3] > 128;
        hit += (opaque && diff > 110) ? 1 : 0;
        n++;
      }
    }
    const v = n ? hit / n : 0;
    if (v > 0.5) { mask[gy * GRID + gx] = 1; inside++; }
  }
}
const inMask = (x, y) => {
  const gx = Math.round((x + 1) * 0.5 * (GRID - 1)), gy = Math.round((1 - y) * 0.5 * (GRID - 1));
  if (gx < 0 || gy < 0 || gx >= GRID || gy >= GRID) return false;
  return mask[gy * GRID + gx] === 1;
};
const inMaskEdge = (x, y) => {
  const e = 2 / GRID;
  return inMask(x, y) && !(inMask(x + e, y) && inMask(x - e, y) && inMask(x, y + e) && inMask(x, y - e));
};

// ---------- 五角星(党徽上方) ----------
const STAR = { cx: 0, cy: 1.16, rOut: 0.30, rIn: 0.12 };
const starVerts = (() => {
  const v = [];
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const r = k % 2 === 0 ? STAR.rOut : STAR.rIn;
    v.push([STAR.cx + Math.cos(a) * r, STAR.cy + Math.sin(a) * r]);
  }
  return v;
})();
function inStar(px, py) {
  let inside2 = false;
  for (let i = 0, j = starVerts.length - 1; i < starVerts.length; j = i++) {
    const [xi, yi] = starVerts[i], [xj, yj] = starVerts[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside2 = !inside2;
  }
  return inside2;
}
const starEdge = (x, y) => {
  const e = 0.012;
  return inStar(x, y) && !(inStar(x + e, y) && inStar(x - e, y) && inStar(x, y + e) && inStar(x, y - e));
};

// ---------- 抖动网格取点 ----------
function harvest(pred, step, want) {
  const edge = [], fill = [];
  for (let y = -1.5; y <= 1.5; y += step) {
    for (let x = -1.5; x <= 1.5; x += step) {
      const jx = x + (Math.random() - 0.5) * step, jy = y + (Math.random() - 0.5) * step;
      if (pred(jx, jy)) edge.push([jx, jy]);
      else if (inMask(jx, jy) || inStar(jx, jy)) fill.push([jx, jy]);
    }
  }
  shuffle(edge); shuffle(fill);
  const nE = Math.min(edge.length, Math.round(want * EDGE_RATIO));
  const out = edge.slice(0, nE).concat(fill.slice(0, Math.max(0, want - nE)));
  return { out, edgeAvail: edge.length, fillAvail: fill.length };
}

const nStar = Math.round(N * STAR_SHARE);
const badge = harvest((x, y) => inMaskEdge(x, y) && !inStar(x, y), 2.6 / GRID, N - nStar);
const star = harvest(starEdge, 0.010, nStar);
let picked = badge.out.concat(star.out);
shuffle(picked);
picked = picked.slice(0, N);

// ---------- 归一化:居中并按长边铺满 [-1,1] ----------
let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
for (const [x, y] of picked) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const span = Math.max(x1 - x0, y1 - y0), mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
const norm = picked.map(([x, y]) => [((x - mx) / span) * 2, ((y - my) / span) * 2]);

// ---------- 预览图 ----------
const S = 900;
const png = new PNG({ width: S, height: S });
for (let i = 0; i < S * S; i++) {
  png.data[i * 4] = 12; png.data[i * 4 + 1] = 13; png.data[i * 4 + 2] = 20; png.data[i * 4 + 3] = 255;
}
for (const [x, y] of norm) {
  const px = Math.round(((x + 1) / 2) * (S - 1)), py = Math.round((1 - (y + 1) / 2) * (S - 1));
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    const i = (clamp(py + dy, 0, S - 1) * S + clamp(px + dx, 0, S - 1)) * 4;
    png.data[i] = 250; png.data[i + 1] = 226; png.data[i + 2] = 170;
  }
}
writeFileSync(join(root, 'tools/preview-emblem.png'), PNG.sync.write(png));

const flat = norm.map(([x, y]) => [Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4]);
writeFileSync(join(root, 'src/data/emblem.js'),
  `/** 标志视图点位:描自党徽标准图形(tools/emblem-ref.png,CC0)+ 顶端五角星,偏重轮廓。\n` +
  ` * 由 tools/make-emblem.mjs 生成,勿手改。 */\n` +
  `export const emblemPoints = ${JSON.stringify(flat)};\n`);
console.log(`掩膜内 ${inside} 格 | 点位 ${flat.length}(徽章 ${badge.out.length},轮廓可采 ${badge.edgeAvail};星 ${star.out.length})`);
