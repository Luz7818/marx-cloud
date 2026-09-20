/**
 * 开场引导(1/3 三页,致敬《诗云》)。
 */
export function initIntro(container, { onEnter }) {
  const slides = [
    {
      cls: 's1',
      html: `
        <div class="intro-kicker">Marx Cloud</div>
        <h1 class="intro-title">思想云</h1>
        <p class="intro-sub">一张可漫游的马克思主义经典星图</p>
        <div class="intro-credit">灵感致敬刘慈欣《诗云》</div>
      `
    },
    {
      cls: 's2',
      html: `
        <p class="intro-line">两百年来,一代代思想家写下无数经典。</p>
        <p class="intro-line">它们不是散落的碎片,<em>而是一团云</em>。</p>
      `
    },
    {
      cls: 's3',
      html: `
        <p class="intro-line">万点星辰,随视角流转:</p>
        <p class="intro-line">每转过 <em>90°</em>,便汇聚成一位思想家的肖像。</p>
        <p class="intro-line">点击星尘,读到一句经典;点击虚空,<em>捞起一句</em>。</p>
        <p class="intro-line small">拖拽旋转 · 滚轮缩放 · 左侧点亮一位思想家</p>
        <button class="intro-enter" type="button">进入星图</button>
      `
    }
  ];

  let i = 0;
  let done = false;
  let pageEl = null;

  container.innerHTML = `
    <div class="intro-stage">
      <div class="intro-page"></div>
      <div class="intro-pager">1 / 3</div>
      <div class="intro-skip">跳过</div>
    </div>
  `;
  const page = container.querySelector('.intro-page');
  const pager = container.querySelector('.intro-pager');
  const skip = container.querySelector('.intro-skip');

  function render() {
    const s = slides[i];
    page.className = `intro-page ${s.cls}`;
    page.innerHTML = s.html;
    pager.textContent = `${i + 1} / 3`;
    pager.style.visibility = i === 0 ? 'hidden' : 'visible';
    const enter = page.querySelector('.intro-enter');
    if (enter) enter.addEventListener('click', (e) => { e.stopPropagation(); finish(); });
  }

  function advance() {
    if (done) return;
    i += 1;
    if (i >= slides.length) { finish(); return; }
    render();
  }

  function finish() {
    if (done) return;
    done = true;
    container.classList.add('leave');
    setTimeout(() => { container.classList.remove('show'); }, 900);
    onEnter && onEnter();
  }

  function open() {
    done = false; i = 0;
    container.classList.add('show');
    container.classList.remove('leave');
    render();
  }

  container.addEventListener('click', advance);
  skip.addEventListener('click', (e) => { e.stopPropagation(); finish(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && container.classList.contains('show')) advance();
  });

  open();
  return { reopen: open };
}
