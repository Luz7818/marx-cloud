/**
 * 把人物照片加工成运行时采样的亮度掩膜(每人一张,存到 public/<id>-mask.png)。
 * 照片灰度与"应画密度"不一致(暗色西装、阴影胡须与背景亮度互相重叠),
 * 无法用单一亮度阈值分割,因此采用手工描摹的剪影多边形:
 *   - 外轮廓多边形 = 头部剪影(衣领舍弃,画面更干净);
 *   - 眉眼/鼻影/胡髭用旋转椭圆挖成稀疏负形;
 *   - 剪影内密度 = BASE 底 + 亮度平滑映射(高光发须更密);
 *   - 剪影外的野生亮度(乱发辉光)按 outsideGain 保留,衣领区用斜线压暗。
 * 坐标系:输出掩膜宽 500,高 = 裁剪框纵横比 × 500,各参数按输出坐标目视标定。
 *
 * 用法:
 *   node tools/prepare-mask.mjs                # 生成全部掩膜
 *   node tools/prepare-mask.mjs --only=engels  # 只生成一位
 *   node tools/prepare-mask.mjs --preview      # 生成标定预览 tools/preview-<id>.png
 */
import { decode as decodeJpeg } from 'jpeg-js';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_WIDTH = 500;

// ---- 各人物参数(坐标均在输出坐标系中目视标定) ----
const CONFIGS = {
  marx: {
    photo: 'marx-photo.jpg',
    crop: { x0: 0.05, x1: 0.995, y0: 0.0, y1: 0.80 },
    baseDensity: 0.16, holeDensity: 0.05, hiLo: 105, hiHi: 215,
    outLo: 100, outHi: 200, outsideGain: 1.0, blur: 1,
    outsideHoles: [],
    // 衣领分界线:经过 P(x,y) 与 P+(dx,dy) 的斜线,线下方压暗亮度核心
    line: { x: 152, y: 388, dx: 83, dy: 77 },
    sil: [
      [148, 92], [168, 48], [222, 28], [288, 24], [352, 42], [408, 80],
      [445, 135], [462, 200], [455, 262], [422, 308], [402, 358], [376, 412],
      [338, 458], [292, 482], [244, 486], [214, 462], [180, 428], [152, 388],
      [130, 342], [130, 286], [118, 228], [126, 168]
    ],
    holes: [
      [233, 192, 38, 15, -8],   // 左眉眼
      [336, 184, 40, 15, 6],    // 右眉眼
      [285, 263, 24, 12, 0]     // 鼻下阴影/人中
    ]
  },
  engels: {
    photo: 'engels-photo.jpg',
    crop: { x0: 0.10, x1: 0.80, y0: 0.0, y1: 0.66 },
    baseDensity: 0.16, holeDensity: 0.05, hiLo: 120, hiHi: 225,
    outLo: 150, outHi: 240, outsideGain: 0.8, blur: 1,
    line: { x: 160, y: 560, dx: 260, dy: 70 },
    outsideHoles: [],
    sil: [
      [95, 105], [225, 30], [330, 68], [393, 149], [425, 245], [448, 350],
      [438, 490], [420, 565], [350, 620], [290, 622], [238, 568], [195, 470], [180, 375],
      [148, 305], [118, 285], [72, 238], [58, 190]
    ],
    holes: [
      [252, 252, 46, 16, -6],   // 左眉眼(3/4 侧脸)
      [356, 256, 48, 16, 6],    // 右眉眼
      [338, 322, 22, 11, 0]     // 鼻下阴影
    ]
  },
  lenin: {
    photo: 'lenin-photo.jpg',
    crop: { x0: 0.24, x1: 0.82, y0: 0.0, y1: 0.46 },
    baseDensity: 0.30, holeDensity: 0.05, hiLo: 90, hiHi: 230,
    outLo: 140, outHi: 250, outsideGain: 1.0, blur: 1,
    line: { x: 210, y: 470, dx: 190, dy: 45 },
    outsideHoles: [[300, 555, 95, 70, 0]],   // 白衬衫领口/领带
    sil: [
      [255, 38], [310, 55], [360, 88], [395, 150], [415, 250], [408, 330],
      [385, 395], [360, 458], [295, 520], [245, 465], [228, 400], [208, 330],
      [206, 282], [190, 250], [160, 205], [170, 140], [205, 85]
    ],
    holes: [
      [225, 248, 44, 16, -4],   // 左眉眼
      [318, 244, 46, 16, 4],    // 右眉眼
      [268, 322, 22, 11, 0],    // 鼻下阴影
      [268, 375, 44, 14, 0]     // 唇上胡髭
    ]
  },
  luxemburg: {
    photo: 'luxemburg-photo.jpg',
    crop: { x0: 0.24, x1: 0.86, y0: 0.08, y1: 0.56 },
    baseDensity: 0.26, holeDensity: 0.05, hiLo: 110, hiHi: 230,
    outLo: 170, outHi: 250, outsideGain: 0.12, blur: 1,
    line: { x: 90, y: 500, dx: 260, dy: 60 },
    outsideHoles: [[420, 545, 120, 60, 0]],  // 白衬衫肩部
    sil: [
      [240, 42], [330, 70], [395, 115], [440, 175], [452, 250], [440, 325],
      [415, 395], [388, 445], [330, 478], [262, 508], [195, 505],
      [155, 492], [127, 468], [100, 400], [86, 335], [82, 315], [90, 278],
      [72, 255], [78, 225], [75, 190], [60, 150], [85, 110], [130, 75]
    ],
    holes: [
      [133, 310, 40, 16, -8],   // 左眉眼
      [208, 304, 42, 16, 6],    // 右眉眼
      [100, 356, 18, 10, 0],    // 鼻下阴影
      [112, 422, 24, 10, 0]     // 唇部阴影
    ]
  }
};

const args = process.argv.slice(2);
const PREVIEW = args.includes('--preview');
const OVERLAY = args.includes('--overlay');
const onlyArg = args.find(a => a.startsWith('--only='));
const ONLY = onlyArg ? onlyArg.split('=')[1] : null;

const smooth = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };

function pointInPoly(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inEllipse(px, py, [cx, cy, rx, ry, deg]) {
  const a = (deg * Math.PI) / 180;
  const dx = px - cx, dy = py - cy;
  const u = (dx * Math.cos(a) + dy * Math.sin(a)) / rx;
  const v = (-dx * Math.sin(a) + dy * Math.cos(a)) / ry;
  return u * u + v * v <= 1;
}

function buildMask(cfg) {
  const jpeg = decodeJpeg(readFileSync(join(root, 'tools', cfg.photo)), {
    useTArray: true, maxMemoryUsageInMB: 2048
  });
  const { width: W, height: H } = jpeg;
  const lum = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    lum[i] = 0.299 * jpeg.data[i * 4] + 0.587 * jpeg.data[i * 4 + 1] + 0.114 * jpeg.data[i * 4 + 2];
  }
  const { crop } = cfg;
  const cx0 = Math.floor(W * crop.x0), cx1 = Math.ceil(W * crop.x1);
  const cy0 = Math.floor(H * crop.y0), cy1 = Math.ceil(H * crop.y1);
  const cw = cx1 - cx0, ch = cy1 - cy0;
  const outH = Math.round((ch / cw) * OUT_WIDTH);
  const sx = cw / OUT_WIDTH, sy = ch / outH;

  const mask = new Float32Array(OUT_WIDTH * outH);
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < OUT_WIDTH; x++) {
      const i = y * OUT_WIDTH + x;
      const ox = Math.min(cw - 1, Math.max(0, Math.round((x + 0.5) * sx)));
      const oy = Math.min(ch - 1, Math.max(0, Math.round((y + 0.5) * sy)));
      const v = lum[(oy + cy0) * W + (ox + cx0)];

      // 亮度核心:照片中发须高光的野生轮廓;衣领区域(斜线以下)渐变压暗
      const L = cfg.line;
      const s = (x - L.x) / L.dx - (y - L.y) / L.dy;
      const lineFactor = Math.max(0, Math.min(1, (s + 1.5) / 4));
      const outT = smooth((v - cfg.outLo) / (cfg.outHi - cfg.outLo));
      const suppressed = cfg.outsideHoles.some(h => inEllipse(x + 0.5, y + 0.5, h));
      let d = outT * cfg.outsideGain * lineFactor * (suppressed ? 0.1 : 1);

      // 多边形底座:保证面部与暗部胡须的体积;负形优先级最高
      if (pointInPoly(x + 0.5, y + 0.5, cfg.sil)) {
        let hole = false;
        for (const h of cfg.holes) if (inEllipse(x + 0.5, y + 0.5, h)) { hole = true; break; }
        if (hole) {
          d = cfg.holeDensity;
        } else {
          const floor = cfg.baseDensity + (1 - cfg.baseDensity) * smooth((v - cfg.hiLo) / (cfg.hiHi - cfg.hiLo));
          d = Math.max(d, floor);
        }
      }
      mask[i] = d;
    }
  }

  // 轻模糊(柔化多边形边,保留五官锐度)
  for (let pass = 0; pass < cfg.blur; pass++) {
    const copy = mask.slice();
    for (let y = 1; y < outH - 1; y++)
      for (let x = 1; x < OUT_WIDTH - 1; x++) {
        const i = y * OUT_WIDTH + x;
        mask[i] = (copy[i] * 4 + copy[i - 1] + copy[i + 1] + copy[i - OUT_WIDTH] + copy[i + OUT_WIDTH] +
          (copy[i - OUT_WIDTH - 1] + copy[i - OUT_WIDTH + 1] + copy[i + OUT_WIDTH - 1] + copy[i + OUT_WIDTH + 1]) * 0.5) / 8;
      }
  }
  return { mask, outW: OUT_WIDTH, outH };
}

function maskToPng(mask, outW, outH) {
  const png = new PNG({ width: outW, height: outH });
  for (let i = 0; i < outW * outH; i++) {
    const b = Math.round(Math.min(1, Math.max(0, mask[i])) * 255);
    png.data[i * 4] = png.data[i * 4 + 1] = png.data[i * 4 + 2] = b;
    png.data[i * 4 + 3] = 255;
  }
  return png;
}

function stats(name, png) {
  const { width: w, height: h, data } = png;
  const avg = (x0, y0, x1, y1) => {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    let s = 0, n = 0;
    for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) { s += data[(y * w + x) * 4]; n++; }
    return (s / n).toFixed(1);
  };
  console.log(`  ${name} ${w}x${h} | 左上 ${avg(10, 10, 90, 90)} 右上 ${avg(w - 90, 10, w - 10, 90)} 中部 ${avg(w / 2 - 60, h / 2 - 30, w / 2 + 60, h / 2 + 30)} 底部 ${avg(w / 2 - 60, h - 70, w / 2 + 60, h - 10)}`);
}

// ---- 标定预览:裁剪照片 + 网格 + 多边形/负形叠加 ----
function buildPreview(id, cfg) {
  const jpeg = decodeJpeg(readFileSync(join(root, 'tools', cfg.photo)), { useTArray: true, maxMemoryUsageInMB: 2048 });
  const { width: W, height: H } = jpeg;
  const { crop } = cfg;
  const cx0 = Math.floor(W * crop.x0), cx1 = Math.ceil(W * crop.x1);
  const cy0 = Math.floor(H * crop.y0), cy1 = Math.ceil(H * crop.y1);
  const cw = cx1 - cx0, ch = cy1 - cy0;
  const outH = Math.round((ch / cw) * OUT_WIDTH);
  const png = new PNG({ width: OUT_WIDTH, height: outH });
  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < OUT_WIDTH; x++) {
      const i = y * OUT_WIDTH + x;
      const ox = Math.min(cw - 1, Math.round((x + 0.5) * cw / OUT_WIDTH));
      const oy = Math.min(ch - 1, Math.round((y + 0.5) * ch / outH));
      const src = (oy + cy0) * W + (ox + cx0);
      const g = Math.round(0.299 * jpeg.data[src * 4] + 0.587 * jpeg.data[src * 4 + 1] + 0.114 * jpeg.data[src * 4 + 2]);
      png.data[i * 4] = png.data[i * 4 + 1] = png.data[i * 4 + 2] = g;
      png.data[i * 4 + 3] = 255;
    }
  }
  const put = (x, y, r, g, b) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= OUT_WIDTH || y >= outH) return;
    const i = (y * OUT_WIDTH + x) * 4;
    png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b;
  };
  const line = (x0, y0, x1, y1, r, g, b) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    for (let k = 0; k <= n; k++) put(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, r, g, b);
  };
  // 网格:50px 细线,100px 粗线
  for (let x = 0; x < OUT_WIDTH; x += 50) {
    const strong = x % 100 === 0;
    for (let y = 0; y < outH; y++) put(x, y, strong ? 90 : 50, strong ? 90 : 50, strong ? 110 : 60);
  }
  for (let y = 0; y < outH; y += 50) {
    const strong = y % 100 === 0;
    for (let x = 0; x < OUT_WIDTH; x++) put(x, y, strong ? 90 : 50, strong ? 90 : 50, strong ? 110 : 60);
  }
  // 多边形:淡红填充 + 红边
  for (let y = 0; y < outH; y++) for (let x = 0; x < OUT_WIDTH; x++) {
    if (pointInPoly(x, y, cfg.sil)) {
      const i = (y * OUT_WIDTH + x) * 4;
      png.data[i] = Math.min(255, png.data[i] * 0.75 + 40);
    }
  }
  const poly = cfg.sil;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length];
    line(x0, y0, x1, y1, 255, 60, 60);
  }
  // 负形椭圆:蓝边
  for (const [cx, cy, rx, ry, deg] of cfg.holes) {
    const a = deg * Math.PI / 180;
    let px = cx + rx * Math.cos(a), py = cy + rx * Math.sin(a);
    for (let t = 0; t <= 360; t += 2) {
      const rad = t * Math.PI / 180;
      const nx = cx + rx * Math.cos(rad) * Math.cos(a) - ry * Math.sin(rad) * Math.sin(a);
      const ny = cy + rx * Math.cos(rad) * Math.sin(a) + ry * Math.sin(rad) * Math.cos(a);
      line(px, py, nx, ny, 90, 140, 255);
      px = nx; py = ny;
    }
  }
  // 衣领线:绿
  const L = cfg.line;
  line(L.x - L.dx * 0.4, L.y - L.dy * 0.4, L.x + L.dx * 1.4, L.y + L.dy * 1.4, 90, 220, 120);
  writeFileSync(join(root, `tools/preview-${id}.png`), PNG.sync.write(png));
  console.log(`  预览 tools/preview-${id}.png (${OUT_WIDTH}x${outH})`);
}

function overlay(png, cfg) {
  const { width: w, height: h, data } = png;
  const put = (x, y, r, g, b) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const i = (y * w + x) * 4;
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  };
  const line = (x0, y0, x1, y1, r, g, b) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    for (let k = 0; k <= n; k++) put(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, r, g, b);
  };
  const poly = cfg.sil;
  for (let i = 0; i < poly.length; i++) {
    const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length];
    line(x0, y0, x1, y1, 255, 80, 80);
  }
  for (const [cx, cy, rx, ry, deg] of cfg.holes) {
    const a = deg * Math.PI / 180;
    let px = cx, py = cy;
    for (let t = 0; t <= 360; t += 2) {
      const rad = t * Math.PI / 180;
      const nx = cx + rx * Math.cos(rad) * Math.cos(a) - ry * Math.sin(rad) * Math.sin(a);
      const ny = cy + rx * Math.cos(rad) * Math.sin(a) + ry * Math.sin(rad) * Math.cos(a);
      line(px, py, nx, ny, 90, 140, 255);
      px = nx; py = ny;
    }
  }
  return png;
}

for (const [id, cfg] of Object.entries(CONFIGS)) {
  if (ONLY && id !== ONLY) continue;
  if (PREVIEW) { buildPreview(id, cfg); continue; }
  const { mask, outW, outH } = buildMask(cfg);
  const png = maskToPng(mask, outW, outH);
  if (OVERLAY) overlay(png, cfg);
  writeFileSync(join(root, `public/${id}-mask.png`), PNG.sync.write(png));
  stats(id, png);
}
if (!PREVIEW) console.log(`掩膜生成完毕 → public/*-mask.png`);
