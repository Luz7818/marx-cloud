/**
 * 把人像原料加工成运行时资产:
 *   1. 头像 public/avatars/<id>.jpg(128×128,主体居中方形裁剪);
 *   2. 星尘掩膜 public/portraits/<id>.png(亮度掩膜,归一化 4:5,运行时按需采样换装);
 *   3. 运行时清单 src/data/portraits.js(ava/mask/credit,徽记回退依据);
 *   4. 署名页 public/portraits/CREDITS.md。
 *
 * 四位旗舰人物(马克思/恩格斯/列宁/卢森堡)沿用 tools/ 里手工标定的照片与既有掩膜,
 * 这里只补生成头像;其余人物读 tools/portrait-src/<id>.*(fetch-portraits.mjs 的产物),
 * 用与 prepare-mask.mjs 同源的自动分割 + 自动曝光管线生成掩膜。
 * 全程无 Math.random:同一批原料重跑逐字节一致。
 *
 * 用法:
 *   node tools/make-portraits.mjs                # 全量(旗舰头像 + 已抓取人物的头像与掩膜)
 *   node tools/make-portraits.mjs --only=id,id   # 只处理指定人物
 *   node tools/make-portraits.mjs --preview      # 额外输出 tools/preview-p-<id>.png 核对图
 */
import { decode as decodeJpeg, encode as encodeJpeg } from 'jpeg-js';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  clamp, smooth, toGray, downsample, boxBlur, gradient, smoothPass, enhanceFaceDetail,
  faceComponent, floodSegment
} from './lib/image-pipeline.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'tools', 'portrait-src');
const MASK_W = 360, MASK_H = 450;          // 归一化 4:5,前端换装按同一纵横比
const AVA = 128;
const PREVIEW = process.argv.includes('--preview');
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.split('=')[1].split(',') : null;

// 旗舰四位:手工标定裁剪 + 面部位置(与 prepare-mask.mjs CONFIGS 一致),掩膜沿用 public/<id>-mask.png
const FLAGSHIP = {
  marx:      { photo: 'marx-photo.jpg',      crop: { x0: 0.05, x1: 0.995, y0: 0.00, y1: 0.70 }, face: [0.53, 0.42], v: 8 },
  engels:    { photo: 'engels-photo.jpg',    crop: { x0: 0.10, x1: 0.80,  y0: 0.00, y1: 0.66 }, face: [0.54, 0.42], v: 4 },
  lenin:     { photo: 'lenin-photo.jpg',     crop: { x0: 0.26, x1: 0.78,  y0: 0.01, y1: 0.43 }, face: [0.46, 0.50], v: 4 },
  luxemburg: { photo: 'luxemburg-photo.jpg', crop: { x0: 0.24, x1: 0.86,  y0: 0.08, y1: 0.57 }, face: [0.38, 0.46], v: 4 }
};
// 其余人物:自动参数(通用肖像的合理默认)
const AUTO = {
  crop: { x0: 0.02, x1: 0.98, y0: 0.01, y1: 0.96 },
  face: [0.5, 0.42], faceR: [0.34, 0.38],
  bgTol: 0.14, gradTol: 0.07, cutY: 1.0,
  detailGain: 1.7, detailGainTex: 1.05, gamma: 1.0, ped: 0.12
};

// 本脚本的 boxBlur 历史口径:纵向只写到 min(w,h)、`y-r` 的 clamp 上界是 w-1
// (`y+r+1` 仍是 h-1)——已被入库掩膜字节级固化(见 lib/image-pipeline.mjs 文件头)。
const blur = (src, w, h, r) => boxBlur(src, w, h, r, { yTop: Math.min(w, h), yLo: w - 1 });

/** 边缘环带的直方图众数(抗深色扫描边框拖偏中位数)。lum 为 0..1 归一化值 */
function bgBorderMode(lum, w, h) {
  const bins = new Float64Array(64);
  const ring = [];
  for (let x = 0; x < w; x++) ring.push(lum[x], lum[(h - 1) * w + x]);
  for (let y = 0; y < h; y++) ring.push(lum[y * w], lum[y * w + w - 1]);
  for (const v of ring) bins[Math.min(63, Math.floor(v * 64))]++;
  let best = 0, bi = 0;
  for (let k = 0; k < 64; k++) if (bins[k] > best) { best = bins[k]; bi = k; }
  return (bi + 0.5) / 64;
}

/** 3×3 形态学(腐蚀 k<0 / 膨胀 k>0),iters 次,确定性 */
function morph(bin, w, h, k, iters) {
  let cur = bin.slice();
  for (let t = 0; t < iters; t++) {
    const src = cur, out = new Uint8Array(w * h);
    if (k < 0) {
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          if (!src[i]) continue;
          if (src[i - 1] && src[i + 1] && src[i - w] && src[i + w] &&
              src[i - w - 1] && src[i - w + 1] && src[i + w - 1] && src[i + w + 1]) out[i] = 1;
        }
    } else {
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x;
          if (src[i] || src[i - 1] || src[i + 1] || src[i - w] || src[i + w]) out[i] = 1;
        }
    }
    cur = out;
  }
  return cur;
}

function largestComponent(bin, w, h) {
  const seen = new Uint8Array(w * h);
  let best = null, bestN = 0;
  const queue = new Int32Array(w * h);
  for (let s = 0; s < w * h; s++) {
    if (!bin[s] || seen[s]) continue;
    let qh = 0, qt = 0, n = 0;
    seen[s] = 1; queue[qt++] = s;
    const comp = [];
    while (qh < qt) {
      const i = queue[qh++]; n++; comp.push(i);
      const x = i % w, y = (i / w) | 0;
      if (x > 0 && bin[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; queue[qt++] = i - 1; }
      if (x < w - 1 && bin[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; queue[qt++] = i + 1; }
      if (y > 0 && bin[i - w] && !seen[i - w]) { seen[i - w] = 1; queue[qt++] = i - w; }
      if (y < h - 1 && bin[i + w] && !seen[i + w]) { seen[i + w] = 1; queue[qt++] = i + w; }
    }
    if (n > bestN) { bestN = n; best = comp; }
  }
  const out = new Uint8Array(w * h);
  if (best) for (const i of best) out[i] = 1;
  return out;
}

function segmentBackground(lum, w, h, cfg) {
  const grad = blur(gradient(lum, w, h), w, h, 3);
  const bgMed = bgBorderMode(lum, w, h);
  // vote=true:泛洪之后追加全局背景投票(与边缘众数同调、低梯度一律视为背景)
  return floodSegment(lum, w, h, cfg, grad, bgMed, true);
}

// ---------- 通用编解码 ----------
function decodeImage(buf) {
  if (buf[0] === 0xFF && buf[1] === 0xD8) {
    const j = decodeJpeg(buf, { useTArray: true, maxMemoryUsageInMB: 2048 });
    return { w: j.width, h: j.height, data: j.data };
  }
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    const p = PNG.sync.read(buf);
    return { w: p.width, h: p.height, data: p.data };
  }
  throw new Error('不支持的图像格式(需 JPEG/PNG)');
}

/** 头肩窗口:从面部种子列的走廊向上/下行走(环带、旁团不再牵引取景) */
function headWindow(subj, w, h, face) {
  const seedX = clamp(Math.round(face[0] * w), 0, w - 1);
  const seedY = clamp(Math.round(face[1] * h), 0, h - 1);
  const corridorN = new Int32Array(h);
  for (let y = 0; y < h; y++) {
    let n = 0;
    for (let x = Math.max(0, seedX - Math.round(w * 0.2)); x <= Math.min(w - 1, seedX + Math.round(w * 0.2)); x++)
      if (subj[y * w + x]) n++;
    corridorN[y] = n;
  }
  const minN = 3;
  const walk = (dir) => {
    let y = seedY, last = seedY, miss = 0;
    while (y >= 1 && y < h - 1) {
      y += dir;
      if (corridorN[y] >= minN) { last = y; miss = 0; }
      else if (++miss > 2) break;
    }
    return last;
  };
  const top = walk(-1), bandEnd = walk(1);
  if (bandEnd - top < 4) return null;
  const bottom = Math.min(h - 1, bandEnd + Math.round((bandEnd - top) * 1.15));
  // 头带内按走廊行像素数加权求水平质心
  let sx = 0, sn = 0;
  for (let y = top; y <= bandEnd; y++) {
    if (corridorN[y] <= 0) continue;
    let x0 = w, x1 = -1;
    for (let x = Math.max(0, seedX - Math.round(w * 0.34)); x <= Math.min(w - 1, seedX + Math.round(w * 0.34)); x++)
      if (subj[y * w + x]) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
    if (x1 < x0) continue;
    sx += (x0 + x1) / 2 * corridorN[y];
    sn += corridorN[y];
  }
  const cx = sn ? sx / sn : seedX;
  let hx0 = 1e9, hx1 = -1e9;
  for (let y = top; y <= bottom; y++) {
    if (corridorN[y] < minN) continue;
    for (let x = Math.max(0, seedX - Math.round(w * 0.34)); x <= Math.min(w - 1, seedX + Math.round(w * 0.34)); x++)
      if (subj[y * w + x]) { if (x < hx0) hx0 = x; if (x > hx1) hx1 = x; }
  }
  if (hx1 < hx0) return null;
  return { top, bandEnd, bottom, cx, hx0, hx1 };
}

/** 生成掩膜(裁剪空间)。返回 {mask,w,h,subj,ok,win} */
function buildAutoMask(img, cfg) {
  const lum0 = toGray(img.w, img.h, img.data);
  const { lum, w, h } = downsample(lum0, img.w, img.h, cfg.crop, MASK_W);
  const { isBg, bgMed } = segmentBackground(lum, w, h, cfg);
  let subj = faceComponent(isBg, w, h, cfg.face);
  // 形态学清理:腐蚀断开细环/排线/细桥 → 取最大连通块 → 膨胀回复
  subj = morph(morph(largestComponent(morph(subj, w, h, -1, 2), w, h), w, h, 1, 2), w, h, -1, 1);
  let n = 0;
  for (let i = 0; i < w * h; i++) n += subj[i];
  const coverage = n / (w * h);
  if (coverage < 0.04) return { subj, w, h, ok: false, coverage };

  // 拉伸基准取自面部椭圆区:让面部影调横跨 0..1,五官才有密度差
  const fx = cfg.face[0] * w, fy = cfg.face[1] * h, frx = cfg.faceR[0] * w, fry = cfg.faceR[1] * h;
  const vals = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const u = (x - fx) / frx, v = (y - fy) / fry;
      if (u * u + v * v <= 1 && subj[y * w + x]) vals.push(lum[y * w + x]);
    }
  if (vals.length < 32) {
    for (let i = 0; i < w * h; i++) if (subj[i]) vals.push(lum[i]);
  }
  vals.sort((a, b) => a - b);
  const pLo = vals[Math.floor(vals.length * 0.08)];
  const pHi = vals[Math.floor(vals.length * 0.92)];
  const lumS = blur(lum, w, h, 1);
  // 纹理优势(版画排线/点刻)判定:高通能量高 → 加大低通半径压纹理、收高通增益
  let texE = 0;
  {
    const low0 = blur(lum, w, h, 9);
    let cnt = 0;
    for (let i = 0; i < w * h; i++)
      if (subj[i]) { texE += Math.abs(lumS[i] - low0[i]); cnt++; }
    texE = cnt ? texE / cnt : 0;
  }
  const textured = texE > 0.045;
  const low = blur(lum, w, h, textured ? 16 : 9);
  const gain = textured ? cfg.detailGainTex : cfg.detailGain;
  const feather = blur(blur(subj, w, h, 2), w, h, 2);

  const win = headWindow(subj, w, h, cfg.face);
  const mask = new Float32Array(w * h);
  const cutPix = (cfg.cutY ?? 1) * h;
  // 头肩窗口的横向衰减:以头带质心为中心,把旁侧误并入的背景团块淡出
  let halfW = 0, softR = 0;
  if (win) {
    halfW = Math.max((win.hx1 - win.hx0) / 2, 6);
    softR = halfW * 2.6;
  }
  for (let i = 0; i < w * h; i++) {
    const edge = smooth(feather[i] * 2.2) * smooth((cutPix - (i / w | 0)) / (0.06 * h));
    if (edge <= 0.002) continue;
    const base = smooth((lumS[i] - pLo) / Math.max(1e-4, pHi - pLo));
    const hp = (lumS[i] - low[i]) * gain;
    const t = smooth(clamp(base + hp, 0, 1));   // smooth = 软膝,压黑洞与过曝
    let v = (cfg.ped + (1 - cfg.ped) * Math.pow(t, cfg.gamma)) * edge;
    if (win) {
      const dx = Math.abs((i % w) - win.cx);
      if (dx > halfW) v *= 1 - smooth((dx - halfW) / Math.max(1e-4, softR - halfW));
    }
    mask[i] = v;
  }
  smoothPass(mask, w, h);
  enhanceFaceDetail(mask, lumS, w, h, { ...cfg, blur });
  return { mask, subj, w, h, ok: true, coverage, win };
}

/** 归一化到 4:5:有头肩窗口时按窗口取景(头带居中、肩部收底),否则顶部对齐 */
function normalize45(m) {
  const { mask, w, h, win } = m;
  const out = new Float32Array(MASK_W * MASK_H);
  let sy0 = 0, sh = h, scx = w / 2, sw = h * (MASK_W / MASK_H);
  if (win) {
    sh = Math.min(h - win.top, win.bottom - win.top + 1);
    sy0 = win.top;
    sw = sh * (MASK_W / MASK_H);
    scx = win.cx;
    const needW = (win.hx1 - win.hx0 + 1) * 1.18;
    if (needW > sw) sw = needW;
  }
  const sx0 = scx - sw / 2;
  for (let y = 0; y < MASK_H; y++) {
    const sy = Math.min(h - 1, Math.max(0, Math.round(sy0 + (y / MASK_H) * sh)));
    for (let x = 0; x < MASK_W; x++) {
      const sx = Math.round(sx0 + (x / MASK_W) * sw);
      out[y * MASK_W + x] = sx >= 0 && sx < w ? mask[sy * w + sx] : 0;
    }
  }
  smoothPass(out, MASK_W, MASK_H);
  return out;
}

/** 头像:主体外接框定位(裁剪空间),回退到通用中心 */
function buildAvatar(img, cfg, subj, subjW, subjH, ok) {
  const lum0 = toGray(img.w, img.h, img.data);
  const cx0 = Math.floor(img.w * cfg.crop.x0), cx1 = Math.ceil(img.w * cfg.crop.x1);
  const cy0 = Math.floor(img.h * cfg.crop.y0), cy1 = Math.ceil(img.h * cfg.crop.y1);
  const cw = cx1 - cx0, ch = cy1 - cy0;
  let bx0, bx1, by0, by1;
  if (ok) {
    bx0 = subjW; bx1 = 0; by0 = subjH; by1 = 0;
    for (let y = 0; y < subjH; y++)
      for (let x = 0; x < subjW; x++)
        if (subj[y * subjW + x]) {
          if (x < bx0) bx0 = x; if (x > bx1) bx1 = x;
          if (y < by0) by0 = y; if (y > by1) by1 = y;
        }
    // 从下采样空间映射回裁剪空间
    bx0 = Math.floor(bx0 / subjW * cw); bx1 = Math.ceil(bx1 / subjW * cw);
    by0 = Math.floor(by0 / subjH * ch); by1 = Math.ceil(by1 / subjH * ch);
  } else {
    bx0 = Math.floor(cw * 0.15); bx1 = Math.floor(cw * 0.85);
    by0 = Math.floor(ch * 0.05); by1 = Math.floor(ch * 0.85);
  }
  const bw = bx1 - bx0, bh = by1 - by0;
  let s = Math.round(Math.max(bw, bh * 1.15) * 1.25);
  s = Math.max(24, Math.min(s, Math.min(cw, ch)));
  let cx = Math.round((bx0 + bx1) / 2);
  let cy = Math.round(by0 + Math.min(bh * 0.42, s * 0.40));
  let x0 = clamp(cx - (s >> 1), 0, cw - s), y0 = clamp(cy - (s >> 1), 0, ch - s);

  const rgba = new Uint8Array(AVA * AVA * 4);
  for (let y = 0; y < AVA; y++) {
    const sy0 = cy0 + y0 + Math.floor((y * s) / AVA);
    const sy1 = Math.min(cy0 + y0 + s, Math.max(sy0 + 1, cy0 + y0 + Math.floor(((y + 1) * s) / AVA)));
    for (let x = 0; x < AVA; x++) {
      const sx0 = cx0 + x0 + Math.floor((x * s) / AVA);
      const sx1 = Math.min(cx0 + x0 + s, Math.max(sx0 + 1, cx0 + x0 + Math.floor(((x + 1) * s) / AVA)));
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++)
        for (let sx = sx0; sx < sx1; sx++) {
          const i = (sy * img.w + sx) * 4;
          r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; n++;
        }
      const o = (y * AVA + x) * 4;
      rgba[o] = r / n; rgba[o + 1] = g / n; rgba[o + 2] = b / n; rgba[o + 3] = 255;
    }
  }
  return Buffer.from(encodeJpeg({ data: rgba, width: AVA, height: AVA }, 82).data);
}

// ---------- 主流程 ----------
const { figures } = await import('file://' + join(root, 'src/data/figures.js').replace(/\\/g, '/'));
const creditsIn = existsSync(join(SRC, 'credits.json')) ? JSON.parse(readFileSync(join(SRC, 'credits.json'), 'utf8')) : {};
const manifest = {};
const creditLines = ['# 人物肖像来源与许可', '', '> 本目录与 `avatars/` 的素材用于教育演示。Commons 文件许可以链接页为准。', ''];

for (const f of figures) {
  if (ONLY && !ONLY.includes(f.id)) continue;
  try {
    if (FLAGSHIP[f.id]) {
      const cfg = FLAGSHIP[f.id];
      const img = decodeImage(readFileSync(join(root, 'tools', cfg.photo)));
      const jpeg = buildAvatar(img, cfg, null, 0, 0, false);
      writeFileSync(join(root, 'public/avatars', `${f.id}.jpg`), jpeg);
      manifest[f.id] = { ava: `avatars/${f.id}.jpg`, mask: `${f.id}-mask.png`, v: cfg.v, credit: '本仓素材 tools/' + cfg.photo };
      creditLines.push(`- **${f.name}**(\`${f.id}\`):本仓 tools/ 手工标定照片;掩膜 public/${f.id}-mask.png`);
      console.log(`✓ ${f.id} 头像(旗舰,掩膜沿用)`);
      continue;
    }
    let file = join(SRC, `${f.id}.jpg`);
    if (!existsSync(file)) file = join(SRC, `${f.id}.png`);
    if (!existsSync(file)) continue;
    const img = decodeImage(readFileSync(file));
    const m = buildAutoMask(img, AUTO);
    const entry = { ava: `avatars/${f.id}.jpg`, mask: null, credit: '' };
    if (m.ok) {
      writeFileSync(join(root, 'public/portraits', `${f.id}.png`), PNG.sync.write(to45Png(m)));
      entry.mask = `portraits/${f.id}.png`;
      entry.v = 4; // 重生成掩膜后递增,否则 Pages CDN 会继续发旧图
    } else {
      console.log(`⚠ ${f.id} 主体分割覆盖 ${(m.coverage * 100).toFixed(1)}%,跳过掩膜(仅头像)`);
    }
    const c = creditsIn[f.id] || {};
    entry.credit = c.file ? `Commons:${c.file}(${c.license || '见文件页'})` : '';
    creditLines.push(`- **${f.name}**(\`${f.id}\`):${c.file ? `[${c.file}](${c.url}) · ${c.license}${c.artist ? ' · ' + c.artist : ''}` : '来源待补'}`);
    writeFileSync(join(root, 'public/avatars', `${f.id}.jpg`), buildAvatar(img, AUTO, m.subj, m.w, m.h, m.ok));
    if (PREVIEW && m.mask) {
      const p = to45Png(m);
      // 主体边界描红核对图
      for (let y = 1; y < MASK_H - 1; y++)
        for (let x = 1; x < MASK_W - 1; x++) {
          const i = y * MASK_W + x;
          const s = m.subj[(Math.floor(y / MASK_H * m.h)) * m.w + Math.floor(x / MASK_W * m.w)] || 0;
          const sr = m.subj[(Math.floor((y + 1) / MASK_H * m.h)) * m.w + Math.floor(x / MASK_W * m.w)] || 0;
          if (s !== sr) { p.data[i * 4] = 255; p.data[i * 4 + 1] = 60; p.data[i * 4 + 2] = 60; }
        }
      writeFileSync(join(root, `tools/preview-p-${f.id}.png`), PNG.sync.write(p));
    }
    manifest[f.id] = entry;
    console.log(`✓ ${f.id} 头像${entry.mask ? ' + 掩膜' : ''}(${img.w}×${img.h})`);
  } catch (e) {
    console.log(`× ${f.id}: ${e.message}`);
  }
}

function to45Png(m) {
  const norm = normalize45(m);
  const png = new PNG({ width: MASK_W, height: MASK_H });
  for (let i = 0; i < MASK_W * MASK_H; i++) {
    const b = Math.round(clamp(norm[i], 0, 1) * 255);
    png.data[i * 4] = png.data[i * 4 + 1] = png.data[i * 4 + 2] = b;
    png.data[i * 4 + 3] = 255;
  }
  return png;
}

// ---------- 写清单与署名 ----------
import { mkdirSync } from 'node:fs';
mkdirSync(join(root, 'public/avatars'), { recursive: true });
mkdirSync(join(root, 'public/portraits'), { recursive: true });

const lines = [
  '/**',
  ' * 生成文件(tools/make-portraits.mjs 产出),勿手改。',
  ' * ava/mask 路径相对 public/;mask 为 null 表示该人物不参与星尘换装,界面回退徽记。',
  ' * v 是旗舰掩膜的缓存串,重画 public/<id>-mask.png 后必须递增。',
  ' */',
  'export const portraits = ' + JSON.stringify(manifest, null, 2) + ';\n'
];
writeFileSync(join(root, 'src/data/portraits.js'), lines.join('\n'));
writeFileSync(join(root, 'public/portraits/CREDITS.md'), creditLines.join('\n') + '\n');
console.log(`\n清单 src/data/portraits.js:${Object.keys(manifest).length} 项;署名 public/portraits/CREDITS.md`);
