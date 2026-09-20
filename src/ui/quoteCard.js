/**
 * 语录卡片:点击星尘或"从虚空捞起"时展示一条经典。
 */
export function initQuoteCard(container) {
  let current = null;      // { quote, figure, index }
  let nextFn = null;

  function show({ quote, figure, index, total, fished = false, onNext = null }) {
    current = { quote, figure, index };
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
      ${onNext ? '<button class="card-next" type="button">同人物下一条 →</button>' : ''}
    `;
    container.querySelector('.card-close').addEventListener('click', hide);
    const nx = container.querySelector('.card-next');
    if (nx) nx.addEventListener('click', () => nextFn && nextFn());
    container.classList.add('show');
  }

  function hide() {
    current = null;
    container.classList.remove('show');
  }

  const isOpen = () => !!current;
  const get = () => current;

  return { show, hide, isOpen, get };
}
