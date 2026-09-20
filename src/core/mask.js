/**
 * 从 public/marx-mask.png(亮度掩膜:越亮粒子越密)采样星尘点位。
 * 返回归一化坐标(x∈[-w/2,w/2], y∈[-h/2,h/2])与亮度权重,单位与肖像高度无关,
 * 由调用方统一缩放到世界坐标。
 */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`掩膜图加载失败: ${url}`));
    img.src = url;
  });
}

export async function samplePortrait(url, count, { gamma = 1.35, floor = 0.04 } = {}) {
  const img = await loadImage(url);
  const w = img.naturalWidth, h = img.naturalHeight;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;

  const n = w * h;
  const cdf = new Float32Array(n);
  let acc = 0;
  for (let i = 0; i < n; i++) {
    let v = data[i * 4] / 255;           // 灰度图取红通道
    v = v < floor ? 0 : Math.pow((v - floor) / (1 - floor), gamma);
    acc += v;
    cdf[i] = acc;
  }

  const pts = new Float32Array(count * 2);
  const bright = new Float32Array(count);
  const aspect = w / h;
  for (let k = 0; k < count; k++) {
    const r = Math.random() * acc;
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid] < r) lo = mid + 1; else hi = mid;
    }
    const i = lo;
    const px = i % w, py = (i / w) | 0;
    pts[k * 2] = px / w - 0.5;
    pts[k * 2 + 1] = 0.5 - py / h;
    bright[k] = data[i * 4] / 255;
  }
  return { pts, bright, aspect };
}

/**
 * 依次采样多张掩膜(每张各采 count 个独立随机点),
 * 返回 [{pts, bright, aspect}],顺序即四块肖像平面(每 90° 一位)。
 */
export async function samplePortraits(urls, count, opts) {
  const out = [];
  for (const url of urls) out.push(await samplePortrait(url, count, opts));
  return out;
}
