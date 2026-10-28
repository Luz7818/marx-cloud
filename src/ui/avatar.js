/**
 * 人物头像:有 portraits 清单项时显示照片,否则回退姓氏徽记。
 * 照片做 duotone 处理:灰度后染上人物色相(保留面部明暗,靠颜色区分人物),
 * CSS 侧用 --h 做色相偏移(sepia 底色约 35°,故偏移量 = 目标色相 - 35)。
 * 图片加载失败同样回退徽记,不会出现破图。
 */
import { portraits } from '../data/portraits.js';

const BASE = import.meta.env.BASE_URL;

export function avaSrc(id) {
  const p = portraits[id];
  return p && p.ava ? `${BASE}${p.ava}` : null;
}

/** hex(#rrggbb)→ 色相角(0-360);解析失败返回 0 */
function hueOf(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ''));
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
  else if (max === g) h = ((b - r) / d + 2) * 60;
  else h = ((r - g) / d + 4) * 60;
  return Math.round(h);
}

/**
 * @param {string} id   人物 id
 * @param {string} name 人物名(徽记取末段首字)
 * @param {string} color 人物色(徽记底色/照片染色与描环)
 * @param {string} size 尺寸类:'ava-sm'(24)| ''(默认 36)| 'ava-lg'(48)| 'ava-cap'(28)
 */
export function avaHTML(id, name, color, size = '') {
  const cls = `ava ${size}`.trim();
  const initial = (name.split('·').pop() || name).slice(0, 1);
  const src = avaSrc(id);
  const vars = `--c:${color};--h:${hueOf(color) - 35}deg`;
  if (!src) return `<span class="${cls} ava-mono" style="${vars}">${initial}</span>`;
  return `<img class="${cls}" loading="lazy" src="${src}" alt="${name}" title="${name}" data-mono="${initial}" style="${vars}">`;
}

/** 容器渲染后调用一次:把加载失败的 <img.ava> 就地换成徽记(继承全部内联样式,含 --c/--h) */
export function hydrateAvas(container) {
  container.querySelectorAll('img.ava').forEach(img => {
    img.addEventListener('error', () => {
      const s = document.createElement('span');
      s.className = `${img.className} ava-mono`;
      s.style.cssText = img.style.cssText;
      s.textContent = img.dataset.mono || '';
      img.replaceWith(s);
    }, { once: true });
  });
}
