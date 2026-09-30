import { figures, figureMap, groups } from '../data/figures.js';
import { avaHTML, hydrateAvas } from './avatar.js';

const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cut = (s, n = 26) => (s.length > n ? s.slice(0, n) + '……' : s);
const birthYear = (f) => parseInt(f.years, 10) || 9999;

/**
 * 构建人物筛选侧栏:三个标签(思想家 / 著作 / 寻句)。
 * 思想家:搜索、点亮(头像 + 画像换装)、飞抵、语录目录、拾遗、按年代排序。
 * 著作:全部出处按收录量排列,展开看该著作下的语录。
 * 寻句:全文检索语录正文。
 * @param {HTMLElement} container
 * @param {{counts:Record<string,number>, quotes:Array, favs:Object,
 *          onFilter:Function, onSelect:Function, onPickQuote:Function, openPanel?:Function}} opts
 */
export function buildPanel(container, { counts, quotes, favs, onFilter, onSelect, onPickQuote, openPanel }) {
  const total = quotes.length;
  const byFigure = {};
  quotes.forEach((q, i) => { (byFigure[q.f] ||= []).push(i); });

  // ---------- 头部:标签 + 人物搜索 + 排序 ----------
  const head = document.createElement('div');
  head.className = 'panel-head';
  head.innerHTML = `
    <div class="panel-tabs">
      <button class="ptab active" data-tab="figures" type="button">思想家</button>
      <button class="ptab" data-tab="works" type="button">著作</button>
      <button class="ptab" data-tab="hunt" type="button">寻句</button>
    </div>
    <input class="panel-search" type="search" placeholder="搜索姓名 / 字号 / 国别…(回车飞抵)" />
    <div class="panel-title-row">
      <button class="panel-order" type="button" title="在分组与生卒年之间切换排列">按年代</button>
      <button class="panel-all" type="button">全部思想星</button>
    </div>
  `;
  container.appendChild(head);
  const search = head.querySelector('.panel-search');
  const orderBtn = head.querySelector('.panel-order');

  const panes = {};
  for (const name of ['figures', 'works', 'hunt']) {
    const p = document.createElement('div');
    p.className = 'tab-pane' + (name === 'figures' ? ' active' : '');
    p.dataset.pane = name;
    container.appendChild(p);
    panes[name] = p;
  }

  function setTab(name) {
    head.querySelectorAll('.ptab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    for (const [key, p] of Object.entries(panes)) p.classList.toggle('active', key === name);
    search.style.display = name === 'figures' ? '' : 'none';
    orderBtn.style.display = name === 'figures' ? '' : 'none';
  }
  head.querySelectorAll('.ptab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

  // ---------- 点亮卡(当前选中人物的画像与简介) ----------
  const focusCard = document.createElement('div');
  focusCard.className = 'panel-focus';
  panes.figures.appendChild(focusCard);

  function renderFocus(id) {
    if (!id) { focusCard.classList.remove('show'); focusCard.innerHTML = ''; return; }
    const f = figureMap[id];
    const works = new Set((byFigure[id] || []).map(i => quotes[i].w)).size;
    focusCard.innerHTML = `
      ${avaHTML(id, f.name, f.color, 'ava-lg')}
      <div class="pf-main">
        <b>${esc(f.name)}</b>
        <span class="pf-sub">${esc(f.years)} · ${esc(f.region)} · ${esc(f.role)}</span>
        <p class="pf-blurb">${esc(f.blurb)}</p>
        <span class="pf-meta">${counts[id] || 0} 句 · ${works} 部著作</span>
      </div>`;
    focusCard.classList.add('show');
    hydrateAvas(focusCard);
  }

  // ---------- 拾遗(本机收藏的句子) ----------
  const favBox = document.createElement('div');
  favBox.className = 'panel-favs';
  panes.figures.appendChild(favBox);

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

  // ---------- 语录目录行(人物与著作共用) ----------
  function quotesListHTML(idxs) {
    return idxs.map(i => `
      <button class="q-row" type="button" data-q="${i}">
        <span class="q-num">${String(i + 1).padStart(3, '0')}</span>
        <span class="q-text">${esc(cut(quotes[i].t, 20))}</span>
        <span class="q-work">${esc(quotes[i].w)}</span>
      </button>`).join('');
  }
  function wireQuotes(box) {
    box.querySelectorAll('.q-row').forEach(r => {
      r.addEventListener('click', (ev) => {
        ev.stopPropagation();
        onPickQuote && onPickQuote(+r.dataset.q);
      });
    });
  }
  function expandQuotes(box, idxs) {
    if (box.dataset.open) { closeAllLists(); return; }
    closeAllLists();
    box.dataset.open = '1';
    box.innerHTML = quotesListHTML(idxs);
    wireQuotes(box);
    box.classList.add('open');
  }

  // ---------- 人物分组 ----------
  const wraps = [];
  const wrapHome = new Map();
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
          ${avaHTML(f.id, f.name, f.color, 'ava-sm')}
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
          expandQuotes(row.querySelector('.row-quotes'), list);
        });
      }
      sec.appendChild(row);
      wraps.push(row);
      wrapHome.set(row, sec);
    }
    panes.figures.appendChild(sec);
  }

  // 按年代排序:把行挪进一个平铺容器(只动显示顺序,不改数据数组)
  let yearMode = false;
  const flat = document.createElement('div');
  flat.className = 'panel-flat';
  orderBtn.addEventListener('click', () => {
    yearMode = !yearMode;
    orderBtn.textContent = yearMode ? '按分组' : '按年代';
    if (yearMode) {
      const firstGroup = panes.figures.querySelector('.panel-group');
      if (firstGroup) panes.figures.insertBefore(flat, firstGroup);
      [...wraps].sort((a, b) => birthYear(figureMap[a.dataset.fig]) - birthYear(figureMap[b.dataset.fig]))
        .forEach(w => flat.appendChild(w));
      container.classList.add('yearmode');
    } else {
      wraps.forEach(w => wrapHome.get(w).appendChild(w));
      flat.remove();
      container.classList.remove('yearmode');
    }
  });

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
    renderFocus(id);
  }

  function select(id) {
    setActive(id);
    onFilter(id);
    onSelect && onSelect(id);
  }

  /** 卡片「人物全集」入口:切回思想家页、点亮、展开语录目录 */
  function openFigure(id) {
    setTab('figures');
    openPanel && openPanel();
    setActive(id);
    onFilter(id);
    onSelect && onSelect(id);
    const wrap = wraps.find(w => w.dataset.fig === id);
    if (wrap) {
      const caret = wrap.querySelector('.row-caret');
      const list = byFigure[id] || [];
      if (caret && list.length) expandQuotes(wrap.querySelector('.row-quotes'), list);
      setTimeout(() => wrap.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
    }
  }

  // ---------- 人物搜索(姓名/字号/国别) ----------
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    wraps.forEach(w => {
      const f = figureMap[w.dataset.fig];
      const hay = [f.name, f.en, f.region, f.role, ...(f.aka || [])].join(' ').toLowerCase();
      w.style.display = !q || hay.includes(q) ? '' : 'none';
    });
    container.querySelectorAll('.panel-group').forEach(g => {
      const any = [...g.querySelectorAll('.panel-row-wrap')].some(r => r.style.display !== 'none');
      g.style.display = any ? '' : 'none';
    });
    if (yearMode) flat.style.display = wraps.some(r => r.style.display !== 'none') ? '' : 'none';
  });
  search.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const first = wraps.find(r => r.style.display !== 'none');
    if (first) select(first.dataset.fig);
  });
  head.querySelector('.panel-all').addEventListener('click', () => {
    setActive(null);
    onFilter(null);
  });

  // ---------- 著作 ----------
  panes.works.innerHTML = `
    <input class="panel-wsearch" type="search" placeholder="在 ${new Set(quotes.map(q => q.w)).size} 部著作中筛选…" />
    <div class="panel-group-label">著作 · 按收录量</div>
    <div class="works-list"></div>
  `;
  const worksMap = new Map();
  quotes.forEach((q, i) => {
    let w = worksMap.get(q.w);
    if (!w) { w = { w: q.w, idxs: [], figs: new Set(), year: q.y }; worksMap.set(q.w, w); }
    w.idxs.push(i);
    w.figs.add(q.f);
    if (w.year == null) w.year = q.y;
  });
  const works = [...worksMap.values()].sort((a, b) => b.idxs.length - a.idxs.length || a.w.localeCompare(b.w, 'zh'));
  const worksList = panes.works.querySelector('.works-list');
  function renderWorks(filter = '') {
    const q = filter.trim().toLowerCase();
    const shown = works.filter(w => !q || w.w.toLowerCase().includes(q)).slice(0, 120);
    worksList.innerHTML = shown.map((w, k) => `
      <div class="work-row-wrap">
        <button class="work-row" type="button" title="${esc(w.w)}">
          <span class="work-rank">${String(k + 1).padStart(2, '0')}</span>
          <span class="work-name">${esc(cut(w.w, 22))}</span>
          <span class="work-meta">${w.idxs.length} 句 · ${w.figs.size} 人</span>
          <span class="row-caret">▸</span>
        </button>
        <div class="row-quotes"></div>
      </div>`).join('') || '<div class="hunt-tip">没有匹配的著作</div>';
    worksList.querySelectorAll('.work-row-wrap').forEach((wrap, k) => {
      const w = shown[k];
      wrap.querySelector('.work-row').addEventListener('click', () => {
        expandQuotes(wrap.querySelector('.row-quotes'), w.idxs);
      });
    });
  }
  renderWorks();
  panes.works.querySelector('.panel-wsearch').addEventListener('input', (e) => renderWorks(e.target.value));

  // ---------- 寻句(全文检索) ----------
  panes.hunt.innerHTML = `
    <input class="panel-hsearch" type="search" placeholder="在 ${total} 句经典中寻找…" />
    <div class="hunt-tip">输入关键词,如「改变世界」「人民」「钢铁」——回车或停顿即查</div>
    <div class="hunt-list"></div>
  `;
  const huntInput = panes.hunt.querySelector('.panel-hsearch');
  const huntList = panes.hunt.querySelector('.hunt-list');
  let huntTimer = null;
  function renderHunt() {
    const q = huntInput.value.trim().toLowerCase();
    if (!q) { huntList.innerHTML = ''; return; }
    const hits = [];
    for (let i = 0; i < quotes.length && hits.length < 100; i++) {
      if (quotes[i].t.toLowerCase().includes(q) || quotes[i].w.toLowerCase().includes(q)) hits.push(i);
    }
    huntList.innerHTML = hits.length
      ? `<div class="hunt-count">命中 ${hits.length}${hits.length >= 100 ? '(截断)' : ''} 句</div>` + hits.map(i => {
        const f = figureMap[quotes[i].f];
        return `<button class="hunt-row" type="button" data-q="${i}">
            <span class="dot" style="--c:${f.color}"></span>
            <span class="q-text">${esc(cut(quotes[i].t, 32))}</span>
            <span class="fav-who">${esc(f.name.split('·').pop())}</span>
          </button>`;
      }).join('')
      : '<div class="hunt-tip">没有找到含该关键词的语录</div>';
    huntList.querySelectorAll('.hunt-row').forEach(r => {
      r.addEventListener('click', () => onPickQuote && onPickQuote(+r.dataset.q));
    });
  }
  huntInput.addEventListener('input', () => { clearTimeout(huntTimer); huntTimer = setTimeout(renderHunt, 180); });
  huntInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { clearTimeout(huntTimer); renderHunt(); } });

  hydrateAvas(container);
  return { select, renderFavs, openFigure, setTab };
}
