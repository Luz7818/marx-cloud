/**
 * 语录卡片:点击星尘或"从虚空捞起"时展示一条经典。
 */
export function initQuoteCard(container) {
  let nextFn = null;

  function flash(btn, text) {
    const old = btn.textContent;
    btn.textContent = text;
    btn.disabled = true;
    setTimeout(() => { btn.textContent = old; btn.disabled = false; }, 1200);
  }

  function show({ quote, figure, index, total, fished = false, onNext = null, onCopy = null, onShare = null, onFav = null, isFav = false, onPostcard = null }) {
    nextFn = onNext;
    container.innerHTML = `
      ${fished ? '<div class="card-fished">◌ 从虚空捞起</div>' : ''}
      <header class="card-head">
        <span class="dot" style="--c:${figure.color}"></span>
        <span class="card-name">${figure.name}</span>
        <span class="card-sub">${figure.years} · ${figure.region}</span>
        <button class="card-close" type="button" aria-label="关闭">×</button>
      </header>
      <blockquote class="card-quote">“${quote.t}”</blockquote>
      <footer class="card-meta">
        <span class="card-work">${quote.w}${quote.y ? ` · ${quote.y}` : ''}</span>
        <span class="card-num">第 ${String(index + 1).padStart(3, '0')} 句 / 共 ${total} 句</span>
      </footer>
      <div class="card-actions">
        ${onNext ? '<button class="card-next" type="button">同人物下一条 →</button>' : ''}
        <button class="card-act" data-act="fav" type="button">${isFav ? '已在拾遗 ✓' : '收进拾遗'}</button>
        <button class="card-act" data-act="postcard" type="button" title="连星图一起导出成图片">留影</button>
        <button class="card-act" data-act="copy" type="button">复制原文</button>
        <button class="card-act" data-act="share" type="button">分享</button>
      </div>
    `;
    container.querySelector('.card-close').addEventListener('click', hide);
    const nx = container.querySelector('.card-next');
    if (nx) nx.addEventListener('click', () => nextFn && nextFn());
    container.querySelector('[data-act="fav"]').addEventListener('click', (e) => {
      if (!onFav) return;
      const on = onFav();
      e.currentTarget.textContent = on ? '已在拾遗 ✓' : '收进拾遗';
    });
    container.querySelector('[data-act="postcard"]').addEventListener('click', () => {
      if (onPostcard) onPostcard();
    });
    container.querySelector('[data-act="copy"]').addEventListener('click', (e) => {
      if (onCopy) Promise.resolve(onCopy()).then((ok) => ok && flash(e.currentTarget, '已复制'));
    });
    container.querySelector('[data-act="share"]').addEventListener('click', (e) => {
      if (onShare) Promise.resolve(onShare()).then((ok) => ok && flash(e.currentTarget, '已复制链接'));
    });
    container.classList.add('show');
  }

  function hide() {
    container.classList.remove('show');
  }

  return { show, hide };
}
