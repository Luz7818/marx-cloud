/**
 * 人物头像:有 portraits 清单项时显示照片(灰度化、人物色描环),否则回退姓氏徽记。
 * 图片加载失败同样回退徽记,不会出现破图。
 */
import { portraits } from '../data/portraits.js';

const BASE = import.meta.env.BASE_URL;

export function avaSrc(id) {
  const p = portraits[id];
  return p && p.ava ? `${BASE}${p.ava}` : null;
}

/**
 * @param {string} id   人物 id
 * @param {string} name 人物名(徽记取末段首字)
 * @param {string} color 人物色(徽记底色/照片描环)
 * @param {string} size 尺寸类:'ava-sm'(20)| ''(默认 34)| 'ava-lg'(44)
 */
export function avaHTML(id, name, color, size = '') {
  const cls = `ava ${size}`.trim();
  const initial = (name.split('·').pop() || name).slice(0, 1);
  const src = avaSrc(id);
  if (!src) return `<span class="${cls} ava-mono" style="--c:${color}">${initial}</span>`;
  return `<img class="${cls}" loading="lazy" src="${src}" alt="${name}" title="${name}" data-mono="${initial}" style="--c:${color}">`;
}

/** 容器渲染后调用一次:把加载失败的 <img.ava> 就地换成徽记 */
export function hydrateAvas(container) {
  container.querySelectorAll('img.ava').forEach(img => {
    img.addEventListener('error', () => {
      const s = document.createElement('span');
      s.className = `${img.className} ava-mono`;
      s.style.setProperty('--c', img.style.getPropertyValue('--c'));
      s.textContent = img.dataset.mono || '';
      img.replaceWith(s);
    }, { once: true });
  });
}
