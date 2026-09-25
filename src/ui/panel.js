import { figures, figureMap, groups } from '../data/figures.js';

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cut = (s, n = 26) => (s.length > n ? s.slice(0, n) + '……' : s);

/**
 * 构建人物筛选侧栏:搜索、点亮、飞抵、语录目录、拾遗。
 * @param {HTMLElement} container
 * @param {{counts:Record<string,number>, quotes:Array, favs:Object,
 *          onFilter:Function, onSelect:Function, onPickQuote:Function}} opts
 */
export function buildPanel(container, { counts, quotes, favs, onFilter, onSelect, onPickQuote }) {
  const total = quotes.length;
  const byFigure = {};
  quotes.forEach((q, i) => { (byFigure[q.f] ||= []).push(i); });

  const head = document.createElement('div');
  head.className = 'panel-head';
  head.innerHTML = `
    <input class="panel-search" type="search" placeholder="搜索姓名 / 字号 / 国别…(回车飞抵)" />
    <div class="panel-title">思想家</div>
    <button class="panel-all" type="button">全部思想星</button>
  `;
  head.querySelector('.panel-all').addEventListener('click', () => {
    setActive(null);
    onFilter(null);
  });
  container.appendChild(head);

  // ---------- 拾遗(本机收藏的句子) ----------
  const favBox = document.createElement('div');
  favBox.className = 'panel-favs';
  container.appendChild(favBox);

  function renderFavs() {
    const ids = favs ? favs.list() : [];
    if (!ids.length) { favBox.innerHTML = ''; favBox.style.display = 'none'; return; }
    favBox.style.display = '';
    favBox.innerHTML = `
      <div class="panel-group-label">拾遗 <span class="fav-n">${ids.length}</span>
        <button class="fav-clear" type="button">清空</button>
      </div>
      ${ids.map(i => {
        const q = quotes[i]; const f = figureMap[q.f];
        return `<button class="fav-row" type="button" data-q="${i}">
          <span class="dot" style="--c:${f.color}"></span>
          <span class="fav-text">${esc(cut(q.t, 22))}</span>
          <span class="fav-who">${esc(f.name.split('·').pop())}</span>
        </button>`;
      }).join('')}
    `;
    favBox.querySelectorAll('.fav-row').forEach(r => {
      r.addEventListener('click', () => onPickQuote && onPickQuote(+r.dataset.q));
    });
    favBox.querySelector('.fav-clear').addEventListener('click', () => { favs.clear(); renderFavs(); });
  }
  renderFavs();

  // ---------- 人物分组 ----------
  for (const g of groups) {
    const figs = figures.filter(f => f.group === g.key);
    if (!figs.length) continue;
    const sec = document.createElement('div');
    sec.className = 'panel-group';
    sec.innerHTML = `<div class="panel-group-label">${g.label}</div>`;
    for (const f of figs) {
      const row = document.createElement('div');
      row.className = 'panel-row-wrap';
      row.dataset.fig = f.id;
      const list = byFigure[f.id] || [];
      row.innerHTML = `
        <button class="panel-row" type="button" title="${esc(f.name)}(${esc(f.en)}) · ${esc(f.blurb)}">
          <span class="dot" style="--c:${f.color}"></span>
          <span class="row-main">
            <span class="row-name">${f.name}</span>
            <span class="row-years">${f.years} · ${f.region}</span>
          </span>
          <span class="row-count">${counts[f.id] || 0}</span>
          <span class="row-caret" title="展开语录目录">${list.length ? '▸' : ''}</span>
        </button>
        <div class="row-quotes"></div>
      `;
      const btn = row.querySelector('.panel-row');
      btn.addEventListener('click', () => {
        const active = btn.classList.contains('active');
        setActive(null);
        closeAllLists();
        if (!active) {
          setActive(f.id);
          onFilter(f.id);
          onSelect && onSelect(f.id);
        } else {
          onFilter(null);
        }
      });
      const caret = row.querySelector('.row-caret');
      if (list.length) {
        caret.addEventListener('click', (e) => {
          e.stopPropagation();
          const box = row.querySelector('.row-quotes');
          if (box.dataset.open) { closeAllLists(); return; }
          box.dataset.open = '1';
          box.innerHTML = list.map(i => `
            <button class="q-row" type="button" data-q="${i}">
              <span class="q-num">${String(i + 1).padStart(3, '0')}</span>
              <span class="q-text">${esc(cut(quotes[i].t, 20))}</span>
              <span class="q-work">${esc(quotes[i].w)}</span>
            </button>`).join('');
          box.querySelectorAll('.q-row').forEach(r => {
            r.addEventListener('click', (ev) => {
              ev.stopPropagation();
              onPickQuote && onPickQuote(+r.dataset.q);
            });
          });
          box.classList.add('open');
        });
      }
      sec.appendChild(row);
    }
    container.appendChild(sec);
  }

  const foot = document.createElement('div');
  foot.className = 'panel-foot';
  foot.innerHTML = `<span>${figures.length} 位思想家</span><span>${total} 句经典</span>`;
  container.appendChild(foot);

  function closeAllLists() {
    container.querySelectorAll('.row-quotes').forEach(b => { b.classList.remove('open'); delete b.dataset.open; });
  }

  function setActive(id) {
    container.querySelectorAll('.panel-row').forEach(r => {
      r.classList.toggle('active', r.parentElement.dataset.fig === id);
    });
    container.classList.toggle('filtering', !!id);
  }

  function select(id) {
    setActive(id);
    onFilter(id);
    onSelect && onSelect(id);
  }

  const search = head.querySelector('.panel-search');
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    container.querySelectorAll('.panel-row-wrap').forEach(w => {
      const f = figureMap[w.dataset.fig];
      const hay = [f.name, f.en, f.region, f.role, ...(f.aka || [])].join(' ').toLowerCase();
      w.style.display = !q || hay.includes(q) ? '' : 'none';
    });
    container.querySelectorAll('.panel-group').forEach(g => {
      const any = [...g.querySelectorAll('.panel-row-wrap')].some(r => r.style.display !== 'none');
      g.style.display = any ? '' : 'none';
    });
  });
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const first = [...container.querySelectorAll('.panel-row-wrap')].find(r => r.style.display !== 'none');
    if (first) select(first.dataset.fig);
  });

  return { select, renderFavs };
}
