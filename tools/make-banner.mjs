/**
 * 生成 README 横幅 docs/banner.svg:
 * 从 public/marx-mask.png 按亮度加权采样星点,在深空背景上以 SVG 圆点
 * 复现"万点星辰聚成肖像"的核心效果,并配上标题文案。
 * 用法:node tools/make-banner.mjs
 */
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const png = PNG.sync.read(readFileSync(join(root, 'public/marx-mask.png')));
const { width: W, height: H, data } = png;

// ---- 亮度 CDF 加权采样星点(与运行时 samplePortrait 同思路) ----
const TARGET = 1500;
const n = W * H;
const cdf = new Float32Array(n);
let acc = 0;
for (let i = 0; i < n; i++) {
  acc += data[i * 4] / 255;
  cdf[i] = acc;
}
const dots = [];
for (let k = 0; k < TARGET; k++) {
  const r = Math.random() * acc;
  let lo = 0, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cdf[mid] < r) lo = mid + 1; else hi = mid;
  }
  const i = lo;
  dots.push({ x: i % W, y: (i / W) | 0, b: data[i * 4] / 255 });
}

// ---- 肖像映射到横幅右侧区域 ----
const REGION = { x: 745, y: 38, w: 412, h: 428 };
const px = (x) => REGION.x + (x / W) * REGION.w;
const py = (y) => REGION.y + (y / H) * REGION.h;

const starCircles = dots.map(({ x, y, b }) => {
  const r = (0.7 + b * 1.3).toFixed(2);
  const o = (0.25 + b * 0.75).toFixed(2);
  const warm = b > 0.72 ? 'fill="#ffe9d6"' : 'fill="#f3f0ea"';
  return `<circle cx="${px(x).toFixed(1)}" cy="${py(y).toFixed(1)}" r="${r}" ${warm} opacity="${o}"/>`;
}).join('\n  ');

// ---- 背景星辰 ----
const bgStars = [];
for (let i = 0; i < 150; i++) {
  const x = (Math.random() * 1200).toFixed(1);
  const y = (Math.random() * 500).toFixed(1);
  const r = (0.4 + Math.random() * 0.9).toFixed(2);
  const o = (0.12 + Math.random() * 0.38).toFixed(2);
  bgStars.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#cdd6ea" opacity="${o}"/>`);
}
// 肖像区外圈微光,烘托星云
const halo = `
  <radialGradient id="halo" cx="0.78" cy="0.47" r="0.42">
    <stop offset="0%" stop-color="#8a2730" stop-opacity="0.20"/>
    <stop offset="60%" stop-color="#1a2038" stop-opacity="0.32"/>
    <stop offset="100%" stop-color="#07080f" stop-opacity="0"/>
  </radialGradient>`;

const FIGS = [
  { name: '马克思', c: '#ff4d4d' },
  { name: '恩格斯', c: '#ff8a5c' },
  { name: '列宁', c: '#ffb830' },
  { name: '卢森堡', c: '#ff9ad5' }
];
let nx = 84;
const nameRow = FIGS.map(({ name, c }) => {
  const g = `<g><circle cx="${nx}" cy="391" r="4.5" fill="${c}"/><circle cx="${nx}" cy="391" r="9" fill="${c}" opacity="0.22"/><text x="${nx + 14}" y="398" font-size="21" fill="#e9e7e2" letter-spacing="2">${name}</text></g>`;
  nx += 14 + name.length * 21 + 34;
  return g;
}).join('\n  ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 500" font-family="'Noto Serif SC','Source Han Serif SC','SimSun',serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07080f"/>
      <stop offset="55%" stop-color="#0b0e1b"/>
      <stop offset="100%" stop-color="#101426"/>
    </linearGradient>
    <linearGradient id="title" x1="0" y1="0" x2="0" y2="1">
      <stop offset="30%" stop-color="#ffffff"/>
      <stop offset="90%" stop-color="#d8b7ba"/>
    </linearGradient>${halo}
  </defs>
  <rect width="1200" height="500" fill="url(#bg)"/>
  <rect width="1200" height="500" fill="url(#halo)"/>
  ${bgStars.join('\n  ')}
  <g>${starCircles}</g>
  <text x="84" y="128" font-size="19" fill="#9298a8" letter-spacing="9">MARX CLOUD · 马克思主义经典星图</text>
  <text x="80" y="248" font-size="104" font-weight="700" fill="url(#title)" letter-spacing="20">思想云</text>
  <text x="84" y="312" font-size="24" fill="#e9e7e2" letter-spacing="4">万点星辰,随视角流转,汇成思想的肖像</text>
  ${nameRow}
  <text x="84" y="452" font-size="16" fill="#9298a8" letter-spacing="3">每颗星都是一句经典 · 拖动星云,每 90° 遇见一位思想家</text>
  <rect x="0.5" y="0.5" width="1199" height="499" fill="none" stroke="#ffffff" stroke-opacity="0.08"/>
</svg>
`;

mkdirSync(join(root, 'docs'), { recursive: true });
writeFileSync(join(root, 'docs/banner.svg'), svg);
console.log(`docs/banner.svg 生成完毕(${TARGET} 星点)`);
