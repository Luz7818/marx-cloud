/**
 * 把人物照片加工成运行时采样的亮度掩膜(每人一张,存到 public/<id>-mask.png)。
 *
 * 管线(照片明暗还原):
 *   1. 裁剪 → 下采样到宽 500(区域平均);
 *   2. 背景分割:从图像边界做泛洪,只穿过「梯度平滑 且 亮度接近边界中位数」的像素,
 *      其余即主体 —— 不手工描摹剪影多边形;
 *   3. 密度 = 主体内亮度的自动曝光(主体亮度 p4..p96 映射到 0..1)+ 高通细节增强,
 *      再按 ped 托底(剪影整体保持密度,明暗只做细节调制),
 *      五官、发须、明暗全部来自照片本身;
 *   4. 主体边缘羽化 + 轻模糊,避免硬切边。
 *
 * 用法:
 *   node tools/prepare-mask.mjs                # 生成全部掩膜
 *   node tools/prepare-mask.mjs --only=engels  # 只生成一位
 *   node tools/prepare-mask.mjs --preview      # 生成掩膜 + 主体边界(红)核对图
 */
import { decode as decodeJpeg } from 'jpeg-js';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_WIDTH = 500;

// ---- 各人物参数:裁剪框 + 少量标定旋钮 ----
const CONFIGS = {
  marx: {
    photo: 'marx-photo.jpg',
    crop: { x0: 0.05, x1: 0.995, y0: 0.0, y1: 0.70 },
    face: [0.53, 0.42], faceR: [0.30, 0.34],
    bgTol: 0.16, gradTol: 0.09, cutY: 1.0, detailGain: 1.7, gamma: 1.15, ped: 0.20
  },
  engels: {
    photo: 'engels-photo.jpg',
    crop: { x0: 0.10, x1: 0.80, y0: 0.0, y1: 0.66 },
    face: [0.54, 0.42], faceR: [0.30, 0.34],
    bgTol: 0.10, gradTol: 0.05, cutY: 0.9, detailGain: 1.8, gamma: 1.3, ped: 0.22
  },
  lenin: {
    photo: 'lenin-photo.jpg',
    crop: { x0: 0.26, x1: 0.78, y0: 0.01, y1: 0.43 },
    face: [0.46, 0.50], faceR: [0.30, 0.36],
    bgTol: 0.10, gradTol: 0.055, cutY: 0.97, detailGain: 1.6, gamma: 1.2, ped: 0.24
  },
  luxemburg: {
    photo: 'luxemburg-photo.jpg',
    crop: { x0: 0.24, x1: 0.86, y0: 0.08, y1: 0.57 },
    face: [0.38, 0.46], faceR: [0.26, 0.32],
    bgTol: 0.10, gradTol: 0.055, cutY: 0.97, detailGain: 1.9, gamma: 0.95, ped: 0.26
  }
};

const args = process.argv.slice(2);
const PREVIEW = args.includes('--preview');
const onlyArg = args.find(a => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.split('=')[1] : null;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/** 区域平均下采样到 OUT_WIDTH 宽 */
function downsample(lum, W, H, crop) {
  const cx0 = Math.floor(W * crop.x0), cx1 = Math.ceil(W * crop.x1);
  const cy0 = Math.floor(H * crop.y0), cy1 = Math.ceil(H * crop.y1);
  const cw = cx1 - cx0, ch = cy1 - cy0;
  const outH = Math.round((ch / cw) * OUT_WIDTH);
  const out = new Float32Array(OUT_WIDTH * outH);
  for (let y = 0; y < outH; y++) {
    const sy0 = cy0 + Math.floor((y * ch) / outH);
    const sy1 = Math.min(cy1, Math.max(sy0 + 1, cy0 + Math.floor(((y + 1) * ch) / outH)));
    for (let x = 0; x < OUT_WIDTH; x++) {
      const sx0 = cx0 + Math.floor((x * cw) / OUT_WIDTH);
      const sx1 = Math.min(cx1, Math.max(sx0 + 1, cx0 + Math.floor(((x + 1) * cw) / OUT_WIDTH)));
      let s = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++)
        for (let sx = sx0; sx < sx1; sx++) { s += lum[sy * W + sx]; n++; }
      out[y * OUT_WIDTH + x] = s / n / 255;
    }
  }
  return { lum: out, w: OUT_WIDTH, h: outH };
}

function boxBlur(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += src[row + clamp(x, 0, w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = acc / (2 * r + 1);
      acc += src[row + clamp(x + r + 1, 0, w - 1)] - src[row + clamp(x - r, 0, w - 1)];
    }
  }
  for (let x = 0; x < w; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[clamp(y, 0, h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = acc / (2 * r + 1);
      acc += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, h - 1) * w + x];
    }
  }
  return out;
}

function gradient(lum, w, h) {
  const g = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = (lum[i + 1] - lum[i - 1]) + (lum[i + w + 1] - lum[i + w - 1]) + (lum[i - w + 1] - lum[i - w - 1]);
      const gy = (lum[i + w] - lum[i - w]) + (lum[i + w + 1] - lum[i + w - 1]) + (lum[i + w - 1] - lum[i - w + 1]);
      g[i] = Math.hypot(gx, gy) / 4;
    }
  return g;
}

/** 边界泛洪:穿过「低梯度 且 亮度落在背景带内」的像素;背景带由上边界估计(避开衣领)。
 *  面部椭圆内永不为背景 —— 保护与背景同亮度的阴影面颊。 */
function segmentBackground(lum, w, h, { bgTol, gradTol, face, faceR }) {
  const grad = boxBlur(gradient(lum, w, h), w, h, 3);
  const ring = [];
  for (let x = 0; x < w; x++) ring.push(lum[x]);
  for (let y = 0; y < Math.floor(h * 0.35); y++) ring.push(lum[y * w], lum[y * w + w - 1]);
  ring.sort((a, b) => a - b);
  const bgMed = ring[ring.length >> 1];
  const fx = face[0] * w, fy = face[1] * h, rx = faceR[0] * w, ry = faceR[1] * h;

  const isBg = new Uint8Array(w * h);
  const queue = new Int32Array(w * h);
  let qh = 0, qt = 0;
  const accept = (i) => {
    if (isBg[i] || grad[i] >= gradTol || Math.abs(lum[i] - bgMed) >= bgTol) return false;
    const x = i % w, y = (i / w) | 0;
    const u = (x - fx) / rx, v = (y - fy) / ry;
    return u * u + v * v > 1;
  };
  const seed = (i) => { if (accept(i)) { isBg[i] = 1; queue[qt++] = i; } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  while (qh < qt) {
    const i = queue[qh++];
    const x = i % w, y = (i / w) | 0;
    if (x > 0 && accept(i - 1)) { isBg[i - 1] = 1; queue[qt++] = i - 1; }
    if (x < w - 1 && accept(i + 1)) { isBg[i + 1] = 1; queue[qt++] = i + 1; }
    if (y > 0 && accept(i - w)) { isBg[i - w] = 1; queue[qt++] = i - w; }
    if (y < h - 1 && accept(i + w)) { isBg[i + w] = 1; queue[qt++] = i + w; }
  }
  return { isBg, bgMed };
}

/** 主体 = 含面部种子的非背景连通块;再闭运算接回被漏分割切断的须发 */
function faceComponent(isBg, w, h, face) {
  let sx = clamp(Math.round(face[0] * w), 0, w - 1);
  let sy = clamp(Math.round(face[1] * h), 0, h - 1);
  let seed = -1;
  for (let r = 0; r < 20 && seed < 0; r++) {
    for (let dy = -r; dy <= r && seed < 0; dy++)
      for (let dx = -r; dx <= r && seed < 0; dx++) {
        const x = sx + dx, y = sy + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        if (!isBg[y * w + x]) seed = y * w + x;
      }
  }
  const main = new Uint8Array(w * h);
  if (seed < 0) return main;
  const queue = new Int32Array(w * h);
  let qh = 0, qt = 0;
  main[seed] = 1; queue[qt++] = seed;
  while (qh < qt) {
    const i = queue[qh++];
    const x = i % w, y = (i / w) | 0;
    if (x > 0 && !isBg[i - 1] && !main[i - 1]) { main[i - 1] = 1; queue[qt++] = i - 1; }
    if (x < w - 1 && !isBg[i + 1] && !main[i + 1]) { main[i + 1] = 1; queue[qt++] = i + 1; }
    if (y > 0 && !isBg[i - w] && !main[i - w]) { main[i - w] = 1; queue[qt++] = i - w; }
    if (y < h - 1 && !isBg[i + w] && !main[i + w]) { main[i + w] = 1; queue[qt++] = i + w; }
  }
  for (let pass = 0; pass < 3; pass++) {
    const add = [];
    for (let y = 1; y < h - 1; y++)
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (main[i] || isBg[i]) continue;
        if (main[i - 1] || main[i + 1] || main[i - w] || main[i + w]) add.push(i);
      }
    for (const i of add) main[i] = 1;
  }
  return main;
}

function buildMask(cfg) {
  const jpeg = decodeJpeg(readFileSync(join(root, 'tools', cfg.photo)), {
    useTArray: true, maxMemoryUsageInMB: 2048
  });
  const { width: W, height: H } = jpeg;
  const lum0 = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    lum0[i] = 0.299 * jpeg.data[i * 4] + 0.587 * jpeg.data[i * 4 + 1] + 0.114 * jpeg.data[i * 4 + 2];
  }
  const { lum, w, h } = downsample(lum0, W, H, cfg.crop);
  const { isBg, bgMed } = segmentBackground(lum, w, h, cfg);
  const subj0 = faceComponent(isBg, w, h, cfg.face);
  if (args.includes('--debug')) {
    let nb = 0, ns = 0;
    for (let i = 0; i < w * h; i++) { nb += isBg[i]; ns += subj0[i]; }
    console.log(`  [debug] ${cfg.photo} bgMed=${bgMed.toFixed(3)} bg=${(100 * nb / (w * h)).toFixed(1)}% subj=${(100 * ns / (w * h)).toFixed(1)}%`);
  }

  // 主体亮度百分位 → 自动曝光区间(区间收窄,面部明暗反差更大)
  const vals = [];
  for (let i = 0; i < w * h; i++) if (subj0[i]) vals.push(lum[i]);
  vals.sort((a, b) => a - b);
  const pLo = vals[Math.floor(vals.length * 0.10)];
  const pHi = vals[Math.floor(vals.length * 0.90)];

  const low = boxBlur(lum, w, h, 9);   // 局部参考:眼窝/眉/须这类小暗结构靠它显形
  const lumS = boxBlur(lum, w, h, 1);   // 抑胶片颗粒后再取明暗与高通
  const feather = boxBlur(boxBlur(subj0, w, h, 2), w, h, 2);

  const mask = new Float32Array(w * h);
  const cutPix = (cfg.cutY ?? 1) * h;
  for (let i = 0; i < w * h; i++) {
    const edge = smooth(feather[i] * 2.2) * smooth((cutPix - (i / w | 0)) / (0.06 * h));
    if (edge <= 0.002) continue;
    const base = smooth((lumS[i] - pLo) / Math.max(1e-4, pHi - pLo));
    const hp = (lumS[i] - low[i]) * cfg.detailGain;
    const t = clamp(base + hp, 0, 1);
    // 主体内托底:剪影整体保持密度,明暗只做细节调制(否则暗部发须空成一片,认不出人)
    const ped = cfg.ped ?? 0.34;
    mask[i] = (ped + (1 - ped) * Math.pow(t, cfg.gamma)) * edge;
  }

  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      mask[i] = (copy[i] * 4 + copy[i - 1] + copy[i + 1] + copy[i - w] + copy[i + w] +
        (copy[i - w - 1] + copy[i - w + 1] + copy[i + w - 1] + copy[i + w + 1]) * 0.5) / 8;
    }
  return { mask, outW: w, outH: h, subj: subj0 };
}

function maskToPng(mask, outW, outH) {
  const png = new PNG({ width: outW, height: outH });
  for (let i = 0; i < outW * outH; i++) {
    const b = Math.round(clamp(mask[i], 0, 1) * 255);
    png.data[i * 4] = png.data[i * 4 + 1] = png.data[i * 4 + 2] = b;
    png.data[i * 4 + 3] = 255;
  }
  return png;
}

/** 核对图:掩膜 + 主体边界描红 */
function buildPreview(id, cfg) {
  const { mask, outW, outH, subj } = buildMask(cfg);
  const png = maskToPng(mask, outW, outH);
  for (let y = 1; y < outH - 1; y++)
    for (let x = 1; x < outW - 1; x++) {
      const i = y * outW + x;
      if (subj[i] !== subj[i + 1] || subj[i] !== subj[i + outW]) {
        png.data[i * 4] = 255; png.data[i * 4 + 1] = 60; png.data[i * 4 + 2] = 60;
      }
    }
  writeFileSync(join(root, `tools/preview-${id}.png`), PNG.sync.write(png));
  console.log(`  预览 tools/preview-${id}.png (${outW}x${outH})`);
}

function stats(name, png) {
  const { width: w, height: h, data } = png;
  let sum = 0, nz = 0;
  for (let i = 0; i < w * h; i++) { const v = data[i * 4]; sum += v; if (v > 8) nz++; }
  console.log(`  ${name} ${w}x${h} | 平均亮度 ${(sum / (w * h)).toFixed(1)} | 有效覆盖 ${(100 * nz / (w * h)).toFixed(1)}%`);
}

for (const [id, cfg] of Object.entries(CONFIGS)) {
  if (ONLY && id !== ONLY) continue;
  if (PREVIEW) { buildPreview(id, cfg); continue; }
  const { mask, outW, outH } = buildMask(cfg);
  const png = maskToPng(mask, outW, outH);
  writeFileSync(join(root, `public/${id}-mask.png`), PNG.sync.write(png));
  stats(id, png);
}
if (!PREVIEW) console.log(`掩膜生成完毕 → public/*-mask.png`);
