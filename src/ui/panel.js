import { figures, groups } from '../data/figures.js';

/**
 * 构建人物筛选侧栏。
 * @param {HTMLElement} container
 * @param {{ counts: Record<string, number>, onFilter: (id: string|null) => void }} opts
 */
export function buildPanel(container, { counts, onFilter }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  const head = document.createElement('div');
  head.className = 'panel-head';
  head.innerHTML = `
    <div class="panel-title">思想家</div>
    <button class="panel-all" type="button">全部思想星</button>
  `;
  head.querySelector('.panel-all').addEventListener('click', () => {
    setActive(null);
    onFilter(null);
  });
  container.appendChild(head);

  for (const g of groups) {
    const figs = figures.filter(f => f.group === g.key);
    if (!figs.length) continue;
    const sec = document.createElement('div');
    sec.className = 'panel-group';
    sec.innerHTML = `<div class="panel-group-label">${g.label}</div>`;
    for (const f of figs) {
      const row = document.createElement('button');
      row.className = 'panel-row';
      row.type = 'button';
      row.dataset.fig = f.id;
      row.title = `${f.name}(${f.en}) · ${f.blurb}`;
      row.innerHTML = `
        <span class="dot" style="--c:${f.color}"></span>
        <span class="row-main">
          <span class="row-name">${f.name}</span>
          <span class="row-years">${f.years} · ${f.region}</span>
        </span>
        <span class="row-count">${counts[f.id] || 0}</span>
      `;
      row.addEventListener('click', () => {
        const active = row.classList.contains('active');
        setActive(null);
        if (!active) { setActive(f.id); }
        onFilter(active ? null : f.id);
      });
      sec.appendChild(row);
    }
    container.appendChild(sec);
  }

  const foot = document.createElement('div');
  foot.className = 'panel-foot';
  foot.innerHTML = `<span>${figures.length} 位思想家</span><span>${total} 句经典</span>`;
  container.appendChild(foot);

  function setActive(id) {
    container.querySelectorAll('.panel-row').forEach(r => {
      r.classList.toggle('active', r.dataset.fig === id);
    });
    container.classList.toggle('filtering', !!id);
  }
  return { setActive };
}
