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
import {
  clamp, smooth, toGray, downsample, boxBlur, gradient, smoothPass, enhanceFaceDetail,
  faceComponent, floodSegment
} from './lib/image-pipeline.mjs';

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

/** 边界泛洪:穿过「低梯度 且 亮度落在背景带内」的像素;背景带由上边界估计(避开衣领)。
 *  面部椭圆内永不为背景 —— 保护与背景同亮度的阴影面颊。 */
function segmentBackground(lum, w, h, cfg) {
  const grad = boxBlur(gradient(lum, w, h), w, h, 3);
  const ring = [];
  for (let x = 0; x < w; x++) ring.push(lum[x]);
  for (let y = 0; y < Math.floor(h * 0.35); y++) ring.push(lum[y * w], lum[y * w + w - 1]);
  ring.sort((a, b) => a - b);
  const bgMed = ring[ring.length >> 1];
  return floodSegment(lum, w, h, cfg, grad, bgMed, false);
}

function buildMask(cfg) {
  const jpeg = decodeJpeg(readFileSync(join(root, 'tools', cfg.photo)), {
    useTArray: true, maxMemoryUsageInMB: 2048
  });
  const { width: W, height: H } = jpeg;
  const lum0 = toGray(W, H, jpeg.data);
  const { lum, w, h } = downsample(lum0, W, H, cfg.crop, OUT_WIDTH);
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

  smoothPass(mask, w, h);
  enhanceFaceDetail(mask, lumS, w, h, cfg);
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
