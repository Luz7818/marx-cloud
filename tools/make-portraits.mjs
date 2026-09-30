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

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'tools', 'portrait-src');
const MASK_W = 360, MASK_H = 450;          // 归一化 4:5,前端换装按同一纵横比
const AVA = 128;
const PREVIEW = process.argv.includes('--preview');
const onlyArg = process.argv.find(a => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.split('=')[1].split(',') : null;

// 旗舰四位:手工标定裁剪 + 面部位置(与 prepare-mask.mjs CONFIGS 一致),掩膜沿用 public/<id>-mask.png
const FLAGSHIP = {
  marx:      { photo: 'marx-photo.jpg',      crop: { x0: 0.05, x1: 0.995, y0: 0.00, y1: 0.70 }, face: [0.53, 0.42], v: 7 },
  engels:    { photo: 'engels-photo.jpg',    crop: { x0: 0.10, x1: 0.80,  y0: 0.00, y1: 0.66 }, face: [0.54, 0.42], v: 3 },
  lenin:     { photo: 'lenin-photo.jpg',     crop: { x0: 0.26, x1: 0.78,  y0: 0.01, y1: 0.43 }, face: [0.46, 0.50], v: 3 },
  luxemburg: { photo: 'luxemburg-photo.jpg', crop: { x0: 0.24, x1: 0.86,  y0: 0.08, y1: 0.57 }, face: [0.38, 0.46], v: 3 }
};
// 其余人物:自动参数(通用肖像的合理默认)
const AUTO = {
  crop: { x0: 0.02, x1: 0.98, y0: 0.01, y1: 0.96 },
  face: [0.5, 0.42], faceR: [0.34, 0.38],
  bgTol: 0.14, gradTol: 0.07, cutY: 1.0, detailGain: 1.7, gamma: 1.15, ped: 0.30
};

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

// ---------- 与 prepare-mask.mjs 同源的管线(确定性,无随机) ----------
function downsample(lum, W, H, crop) {
  const cx0 = Math.floor(W * crop.x0), cx1 = Math.ceil(W * crop.x1);
  const cy0 = Math.floor(H * crop.y0), cy1 = Math.ceil(H * crop.y1);
  const cw = cx1 - cx0, ch = cy1 - cy0;
  const outH = Math.round((ch / cw) * MASK_W);
  const out = new Float32Array(MASK_W * outH);
  for (let y = 0; y < outH; y++) {
    const sy0 = cy0 + Math.floor((y * ch) / outH);
    const sy1 = Math.min(cy1, Math.max(sy0 + 1, cy0 + Math.floor(((y + 1) * ch) / outH)));
    for (let x = 0; x < MASK_W; x++) {
      const sx0 = cx0 + Math.floor((x * cw) / MASK_W);
      const sx1 = Math.min(cx1, Math.max(sx0 + 1, cx0 + Math.floor(((x + 1) * cw) / MASK_W)));
      let s = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++)
        for (let sx = sx0; sx < sx1; sx++) { s += lum[sy * W + sx]; n++; }
      out[y * MASK_W + x] = s / n / 255;
    }
  }
  return { lum: out, w: MASK_W, h: outH };
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
    for (let y = 0; y < w && y < h; y++) {
      out[y * w + x] = acc / (2 * r + 1);
      acc += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, w - 1) * w + x];
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

function toGray(img) {
  const { w, h, data } = img;
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++)
    lum[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
  return lum;
}

function writeGrayPng(mask, w, h, file) {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h; i++) {
    const b = Math.round(clamp(mask[i], 0, 1) * 255);
    png.data[i * 4] = png.data[i * 4 + 1] = png.data[i * 4 + 2] = b;
    png.data[i * 4 + 3] = 255;
  }
  writeFileSync(file, PNG.sync.write(png));
}

function smoothPass(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      mask[i] = (copy[i] * 4 + copy[i - 1] + copy[i + 1] + copy[i - w] + copy[i + w] +
        (copy[i - w - 1] + copy[i - w + 1] + copy[i + w - 1] + copy[i + w + 1]) * 0.5) / 8;
    }
}

/** 生成掩膜(裁剪空间)。返回 {mask,w,h,subj,ok} */
function buildAutoMask(img, cfg) {
  const lum0 = toGray(img);
  const { lum, w, h } = downsample(lum0, img.w, img.h, cfg.crop);
  const { isBg } = segmentBackground(lum, w, h, cfg);
  const subj = faceComponent(isBg, w, h, cfg.face);
  let n = 0;
  for (let i = 0; i < w * h; i++) n += subj[i];
  const coverage = n / (w * h);
  if (coverage < 0.05) return { subj, w, h, ok: false, coverage };

  const vals = [];
  for (let i = 0; i < w * h; i++) if (subj[i]) vals.push(lum[i]);
  vals.sort((a, b) => a - b);
  const pLo = vals[Math.floor(vals.length * 0.10)];
  const pHi = vals[Math.floor(vals.length * 0.90)];
  const low = boxBlur(lum, w, h, 9);
  const lumS = boxBlur(lum, w, h, 1);
  const feather = boxBlur(boxBlur(subj, w, h, 2), w, h, 2);

  const mask = new Float32Array(w * h);
  const cutPix = (cfg.cutY ?? 1) * h;
  for (let i = 0; i < w * h; i++) {
    const edge = smooth(feather[i] * 2.2) * smooth((cutPix - (i / w | 0)) / (0.06 * h));
    if (edge <= 0.002) continue;
    const base = smooth((lumS[i] - pLo) / Math.max(1e-4, pHi - pLo));
    const hp = (lumS[i] - low[i]) * cfg.detailGain;
    const t = clamp(base + hp, 0, 1);
    mask[i] = (cfg.ped + (1 - cfg.ped) * Math.pow(t, cfg.gamma)) * edge;
  }
  smoothPass(mask, w, h);
  return { mask, subj, w, h, ok: true, coverage };
}

/** 归一化到 4:5(顶部对齐:面部通常在上 2/3;过高则裁掉底部) */
function normalize45(m) {
  const { mask, w, h } = m;
  const out = new Float32Array(MASK_W * MASK_H);
  const rows = Math.min(h, MASK_H);
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < MASK_W; x++)
      out[y * MASK_W + x] = mask[y * w + x];
  smoothPass(out, MASK_W, MASK_H);
  return out;
}

/** 头像:主体外接框定位(裁剪空间),回退到通用中心 */
function buildAvatar(img, cfg, subj, subjW, subjH, ok) {
  const lum0 = toGray(img);
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
