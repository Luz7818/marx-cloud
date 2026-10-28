/**
 * 轻量 Toast:右下角浮出的操作反馈条,替代"按钮点了没反应"的静默失败。
 * 首次调用时自动创建宿主元素;同屏最多保留 3 条,过时自动退场。
 */
let host = null;

export function toast(msg, { tone = 'ok', dur = 2400 } = {}) {
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast';
    document.body.appendChild(host);
  }
  const item = document.createElement('div');
  item.className = `toast-item ${tone}`;
  item.textContent = msg;
  host.appendChild(item);
  while (host.children.length > 3) host.firstChild.remove();
  // 入场:下一帧再加类,保证 transition 生效
  requestAnimationFrame(() => item.classList.add('show'));
  setTimeout(() => {
    item.classList.remove('show');
    setTimeout(() => item.remove(), 350);
  }, dur);
}
