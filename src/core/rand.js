/**
 * 确定性随机工具:星↔句稳定配对的种子源。
 * mulberry32 生成可复现的伪随机序列;seedFromString 给按需人物派生独立种子;
 * hash01 是无状态哈希(不依赖调用顺序),用于云层厚度这类"每颗粒子各自定死"的抖动。
 */

/** 32 位种子 → [0,1) 伪随机序列(逐次调用推进状态) */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 字符串 → 32 位种子(FNV-1a),给按需人物的独立采样用 */
export function seedFromString(s) {
  let h = 0x811C9DC5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** 无状态哈希:粒子下标 + 盐 → [0,1),与调用顺序无关 */
export function hash01(i, salt) {
  let h = (Math.imul(i, 374761393) + Math.imul(salt, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
