/**
 * prepare-mask.mjs 与 make-portraits.mjs 共用的图像管线原语。
 *
 * 约定:全部确定性(无随机),同输入同输出。两个脚本的产物已入库,任何改动都必须跑
 * 「重跑两个生成脚本 → git status 零改动」的逐字节回归;做不到字节一致就是改了行为。
 *
 * 两套历史口径的差异用参数显式表达,不许静默统一:
 *   - downsample 的目标宽度由调用方给(旗舰掩膜 500 / 换装掩膜 360);
 *   - boxBlur 的纵向写入边界与 y-r 的 clamp 上界按调用方口径传入:prepare-mask 写满
 *     整列、两个 clamp 都是 h-1;make-portraits 只写到 min(w,h),且历史上 `y-r` 的
 *     clamp 是 w-1 而 `y+r+1` 仍是 h-1(一行里两个上界各管各的半改状态)——已被
 *     入库的 79 张换装掩膜字节级固化,不是笔误可顺手"修"的;
 *   - segmentBackground 只共用泛洪核:背景带估计(环带中位数 vs 边缘直方图众数)
 *     与全局背景投票(仅 make-portraits)留在各自脚本,grad 由调用方按自己的
 *     boxBlur 口径算好传入。
 */

export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

/** 亮度平面:0.299R + 0.587G + 0.114B */
export function toGray(w, h, rgba) {
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++)
    lum[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
  return lum;
}

/** 区域平均下采样到 outW 宽 */
export function downsample(lum, W, H, crop, outW) {
  const cx0 = Math.floor(W * crop.x0), cx1 = Math.ceil(W * crop.x1);
  const cy0 = Math.floor(H * crop.y0), cy1 = Math.ceil(H * crop.y1);
  const cw = cx1 - cx0, ch = cy1 - cy0;
  const outH = Math.round((ch / cw) * outW);
  const out = new Float32Array(outW * outH);
  for (let y = 0; y < outH; y++) {
    const sy0 = cy0 + Math.floor((y * ch) / outH);
    const sy1 = Math.min(cy1, Math.max(sy0 + 1, cy0 + Math.floor(((y + 1) * ch) / outH)));
    for (let x = 0; x < outW; x++) {
      const sx0 = cx0 + Math.floor((x * cw) / outW);
      const sx1 = Math.min(cx1, Math.max(sx0 + 1, cx0 + Math.floor(((x + 1) * cw) / outW)));
      let s = 0, n = 0;
      for (let sy = sy0; sy < sy1; sy++)
        for (let sx = sx0; sx < sx1; sx++) { s += lum[sy * W + sx]; n++; }
      out[y * outW + x] = s / n / 255;
    }
  }
  return { lum: out, w: outW, h: outH };
}

/** 可分离盒式模糊。yTop/yLo 的默认值是 prepare-mask 口径(整列写入、clamp 到 h-1),
 *  见文件头说明;yLo 只约束 `y - r` 的读取上界。 */
export function boxBlur(src, w, h, r, { yTop = h, yLo = h - 1 } = {}) {
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
    for (let y = 0; y < yTop; y++) {
      out[y * w + x] = acc / (2 * r + 1);
      acc += tmp[clamp(y + r + 1, 0, h - 1) * w + x] - tmp[clamp(y - r, 0, yLo) * w + x];
    }
  }
  return out;
}

export function gradient(lum, w, h) {
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

/** 3×3 十字加权平滑(就地修改):主体边缘羽化后的收尾 */
export function smoothPass(mask, w, h) {
  const copy = mask.slice();
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      mask[i] = (copy[i] * 4 + copy[i - 1] + copy[i + 1] + copy[i - w] + copy[i + w] +
        (copy[i - w - 1] + copy[i - w + 1] + copy[i + w - 1] + copy[i + w + 1]) * 0.5) / 8;
    }
}

/** 主体 = 含面部种子的非背景连通块;再闭运算接回被漏分割切断的须发 */
export function faceComponent(isBg, w, h, face) {
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

/** 泛洪背景分割核:从图像边界扩散,穿过「低梯度 且 亮度接近 bgMed 且 在面部椭圆外」的像素。
 *  grad 与 bgMed 由调用方按各自口径算好传入;vote=true 时追加全局背景投票
 *  (与边缘众数同调、低梯度的像素一律视为背景,修复泛洪被环带/暗边挡住时的整图误判)。 */
export function floodSegment(lum, w, h, { bgTol, gradTol, face, faceR }, grad, bgMed, vote) {
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
  if (vote) {
    for (let i = 0; i < w * h; i++) {
      if (isBg[i]) continue;
      const x = i % w, y = (i / w) | 0;
      const u = (x - fx) / rx, v = (y - fy) / ry;
      if (u * u + v * v > 1 && grad[i] < gradTol * 1.25 && Math.abs(lum[i] - bgMed) < bgTol * 1.1) isBg[i] = 1;
    }
  }
  return { isBg, bgMed };
}
