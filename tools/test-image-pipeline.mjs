import assert from 'node:assert/strict';
import * as pipeline from './lib/image-pipeline.mjs';

assert.equal(typeof pipeline.enhanceFaceDetail, 'function', '面部细节增强函数尚未实现');

const tests = [];
const test = (name, run) => tests.push({ name, run });
const centeredFace = (w, h, rx, ry = rx) => ({
  face: [Math.floor(w / 2) / w, Math.floor(h / 2) / h],
  faceR: [rx / w, ry / h]
});
const gradient = (w, h) => {
  const lum = new Float32Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) lum[y * w + x] = 0.38 + 0.5 * x / (w - 1);
  return lum;
};
const assertBounded = (mask) => {
  for (const value of mask) assert.ok(value >= 0 && value <= 1, '输出亮度必须保持在 0..1');
};

test('面部椭圆外及羽化边界的每个像素保持不变', () => {
  const w = 25, h = 25;
  const cfg = centeredFace(w, h, 8);
  const lum = gradient(w, h);
  const mask = Float32Array.from(lum, (value, i) => 0.2 + value * 0.5 + i / (w * h) * 0.01);
  const before = mask.slice();
  pipeline.enhanceFaceDetail(mask, lum, w, h, cfg);

  const fx = cfg.face[0] * w, fy = cfg.face[1] * h;
  const rx = cfg.faceR[0] * w, ry = cfg.faceR[1] * h;
  let boundaryPixels = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const d2 = ((x - fx) / rx) ** 2 + ((y - fy) / ry) ** 2;
      if (d2 >= 1) {
        assert.equal(mask[y * w + x], before[y * w + x], `椭圆外像素(${x},${y})被修改`);
        if (d2 === 1) boundaryPixels++;
      }
    }
  assert.ok(boundaryPixels > 0, '测试夹具必须覆盖羽化边界像素');
});

test('百分位映射单独恢复宽域影调并压缩高光', () => {
  const w = 25, h = 25;
  const lum = gradient(w, h);
  const mask = new Float32Array(w * h).fill(0.94);
  pipeline.enhanceFaceDetail(mask, lum, w, h, {
    ...centeredFace(w, h, 10),
    fineGain: 0,
    mediumGain: 0
  });
  const faceTones = [];
  for (let y = 8; y <= 16; y++)
    for (let x = 8; x <= 16; x++) faceTones.push(mask[y * w + x]);
  assert.ok(Math.max(...faceTones) - Math.min(...faceTones) > 0.25,
    '百分位映射应恢复原照片中的明暗层次');
  assert.ok(mask[12 * w + 16] < 0.94, '面部高光应使用软肩压缩');
});

test('细尺度暗部恢复独立于百分位映射', () => {
  const w = 41, h = 41, center = 20 * w + 20;
  const lum = gradient(w, h);
  for (let x = 17; x <= 23; x++) lum[20 * w + x] -= 0.12;
  const cfg = { ...centeredFace(w, h, 16), mediumGain: 0 };
  const baseline = new Float32Array(w * h).fill(0.9);
  const detailed = baseline.slice();
  pipeline.enhanceFaceDetail(baseline, lum, w, h, { ...cfg, fineGain: 0 });
  pipeline.enhanceFaceDetail(detailed, lum, w, h, { ...cfg, fineGain: 0.9 });
  assert.ok(detailed[center] < baseline[center] - 0.02,
    '启用细尺度增益应比相同百分位映射基线恢复更多暗部');
});

test('中尺度暗部恢复独立于百分位映射', () => {
  const w = 41, h = 41, center = 20 * w + 20;
  const lum = gradient(w, h);
  for (let y = 17; y <= 23; y++)
    for (let x = 17; x <= 23; x++) lum[y * w + x] -= 0.12;
  const cfg = { ...centeredFace(w, h, 16), fineGain: 0 };
  const baseline = new Float32Array(w * h).fill(0.9);
  const detailed = baseline.slice();
  pipeline.enhanceFaceDetail(baseline, lum, w, h, { ...cfg, mediumGain: 0 });
  pipeline.enhanceFaceDetail(detailed, lum, w, h, { ...cfg, mediumGain: 0.4 });
  assert.ok(detailed[center] < baseline[center] - 0.015,
    '启用中尺度增益应比相同百分位映射基线恢复更多暗部');
});

test('空面部样本是确定性 no-op', () => {
  const w = 25, h = 25;
  const lum = gradient(w, h);
  for (let x = 9; x <= 15; x++) lum[12 * w + x] = 0.05;
  const mask = new Float32Array(w * h).fill(0.02);
  const before = mask.slice();
  pipeline.enhanceFaceDetail(mask, lum, w, h, centeredFace(w, h, 9));
  assert.deepEqual(mask, before, '没有有效面部样本时必须保持输入不变');
});

test('可忽略动态范围的平坦面部是确定性 no-op', () => {
  const w = 25, h = 25;
  const lum = new Float32Array(w * h).fill(0.6);
  const mask = Float32Array.from({ length: w * h }, (_, i) => 0.5 + i / (w * h) * 0.2);
  const before = mask.slice();
  pipeline.enhanceFaceDetail(mask, lum, w, h, centeredFace(w, h, 9));
  assert.deepEqual(mask, before, '平坦面部不能被压向 ped');
});

test('孤立暗噪点不会被负残差放大为黑点', () => {
  const w = 31, h = 31, center = 15 * w + 15;
  const lum = gradient(w, h);
  lum[center] = 0;
  const cfg = centeredFace(w, h, 12);
  const baseline = new Float32Array(w * h).fill(0.94);
  const enhanced = baseline.slice();
  pipeline.enhanceFaceDetail(baseline, lum, w, h, { ...cfg, fineGain: 0, mediumGain: 0 });
  pipeline.enhanceFaceDetail(enhanced, lum, w, h, cfg);
  assert.ok(enhanced[center] >= baseline[center] - 0.02,
    '孤立暗噪点的细节修正应被抑制而非依赖最终 clamp');
  assertBounded(enhanced);
});

test('注入历史自动模糊口径时结果确定且有界', () => {
  const w = 17, h = 25;
  const lum = gradient(w, h);
  for (let x = 6; x <= 10; x++) lum[8 * w + x] -= 0.1;
  const calls = [];
  const historicalBlur = (src, width, height, radius) => {
    calls.push(radius);
    return pipeline.boxBlur(src, width, height, radius, {
      yTop: Math.min(width, height),
      yLo: width - 1
    });
  };
  const cfg = {
    face: [8 / w, 8 / h],
    faceR: [6 / w, 7 / h],
    blur: historicalBlur
  };
  const first = new Float32Array(w * h).fill(0.91);
  const second = first.slice();
  pipeline.enhanceFaceDetail(first, lum, w, h, cfg);
  pipeline.enhanceFaceDetail(second, lum, w, h, cfg);
  assert.deepEqual(calls, [2, 8, 2, 8], '共享阶段必须按原半径调用注入的历史模糊');
  assert.deepEqual(second, first, '历史自动模糊路径必须逐值确定');
  assertBounded(first);
});

const failures = [];
for (const { name, run } of tests) {
  try { run(); }
  catch (error) { failures.push(`${name}: ${error.message}`); }
}
if (failures.length) throw new Error(`图像管线测试失败:\n- ${failures.join('\n- ')}`);
console.log('图像管线测试通过');
