import './style.css';
import { samplePortraits } from './core/mask.js';
import { createCloud, createBackdrop } from './core/cloud.js';
import { createScene } from './core/scene.js';
import { figures, figureMap, groups } from './data/figures.js';
import { quotes } from './data/quotes.js';
import { emblemPoints } from './data/emblem.js';
import { buildPanel } from './ui/panel.js';
import { initQuoteCard } from './ui/quoteCard.js';
import { initIntro } from './ui/intro.js';
import { initFavorites } from './ui/favorites.js';
import { savePostcard } from './ui/postcard.js';

// ---------- DOM ----------
const canvas = document.getElementById('scene');
const tooltip = document.getElementById('tooltip');
const loading = document.getElementById('loading');
const hint = document.getElementById('hint');
const panelEl = document.getElementById('panel');
const captionEl = document.getElementById('figure-caption');
const body = document.body;

let intro = null;
let voidFishOn = true;
const favs = initFavorites();
document.getElementById('btn-panel').addEventListener('click', () => body.classList.toggle('panel-open'));
document.getElementById('btn-about').addEventListener('click', () => intro && intro.reopen());

// ---------- 语录索引 ----------
const figureIndex = Object.fromEntries(figures.map((f, i) => [f.id, i]));
const quotesByFigure = {};
quotes.forEach((q, i) => {
  (quotesByFigure[q.f] ||= []).push(i);
});
const counts = Object.fromEntries(figures.map(f => [f.id, (quotesByFigure[f.id] || []).length]));
const TOTAL = quotes.length;

const groupKeys = groups.map(g => g.key);
const groupStats = groupKeys.map(k => {
  const fs = figures.filter(f => f.group === k);
  return { figs: fs.length, quotes: fs.reduce((a, f) => a + (counts[f.id] || 0), 0) };
});

// ---------- 星尘数据装配 ----------
const isMobile = matchMedia('(pointer: coarse)').matches || innerWidth < 768;

// 软件渲染检测(SwiftShader/llvmpipe 等)——降粒子数,硬件 GPU 不受影响
function detectSoftwareGL() {
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const r = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return /swiftshader|llvmpipe|software|basic render/i.test(String(r));
  } catch { return false; }
}
const FORCE_LITE = new URLSearchParams(location.search).has('lite');
const SOFT_GL = detectSoftwareGL();
const COUNT = FORCE_LITE ? 9000 : SOFT_GL ? 14000 : isMobile ? 20000 : 28000;
const PORTRAIT_H = 6.4;

// 四块肖像平面:每 90° 一位,按生卒年排序(起点为初始视角)
const PORTRAIT_PLANES = [
  { id: 'marx', v: 7 },
  { id: 'engels', v: 3 },
  { id: 'lenin', v: 3 },
  { id: 'luxemburg', v: 3 }
];
const planeFigures = PORTRAIT_PLANES.map(p => figureMap[p.id]);

// 按语录数量加权,给每颗粒子分配人物与语录
const figCum = [];
let acc = 0;
for (const f of figures) {
  acc += Math.max(1, counts[f.id]);
  figCum.push(acc);
}
const figIndexByParticle = new Array(COUNT);
const quoteIdxByParticle = new Array(COUNT);
const groupIdxByParticle = new Array(COUNT);
const colors = new Array(COUNT);

const boot = async () => {
  const planes = await samplePortraits(
    PORTRAIT_PLANES.map(p => `${import.meta.env.BASE_URL}${p.id}-mask.png?v=${p.v}`),
    COUNT
  );

  for (let i = 0; i < COUNT; i++) {
    const r = Math.random() * acc;
    let lo = 0, hi = figures.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (figCum[mid] < r) lo = mid + 1; else hi = mid;
    }
    const f = figures[lo];
    figIndexByParticle[i] = lo;
    groupIdxByParticle[i] = groupKeys.indexOf(f.group);
    const list = quotesByFigure[f.id] || [0];
    quoteIdxByParticle[i] = list[(Math.random() * list.length) | 0] || 0;
    colors[i] = f.color;
  }

  const cloud = createCloud({
    planes,
    figIndex: figIndexByParticle,
    groupIdx: groupIdxByParticle,
    emblem: emblemPoints,
    quoteIdx: quoteIdxByParticle,
    colors,
    height: PORTRAIT_H
  });
  if (isMobile || SOFT_GL) cloud.uniforms.uSize.value = 0.26; // 小屏/软渲染下加大光点
  const backdrop = createBackdrop(isMobile ? 900 : 1500);
  const scene = createScene(canvas, cloud, backdrop, {
    planes: planes.map(p => ({ w: PORTRAIT_H * p.aspect, h: PORTRAIT_H }))
  });

  // ---------- UI ----------
  // ---------- 搜索/点选 → 点亮星群并飞抵 ----------
  let viewMode = 'portrait';   // 'portrait' | 'group'
  function flyToFigure(id) {
    const f = figureMap[id];
    const slot = viewMode === 'group'
      ? groupKeys.indexOf(f.group)
      : PORTRAIT_PLANES.findIndex(p => p.id === id);
    if (slot >= 0) scene.flyTo((slot * Math.PI) / 2);
  }

  const card = initQuoteCard(document.getElementById('quote-card'));
  const panel = buildPanel(panelEl, {
    counts,
    quotes,
    favs,
    onFilter: (id) => { cloud.uniforms.uFocus.value = id == null ? -1 : figureIndex[id]; },
    onSelect: flyToFigure,
    onPickQuote: (i) => { panel.select(quotes[i].f); showQuote(i); }
  });

  // ---------- 顶栏控制:画质 / 巡游速度 / 随机拾句 ----------
  const baseUSize = cloud.uniforms.uSize.value;
  let adaptOn = true;
  const qBtn = document.getElementById('btn-quality');
  const QUALITY = ['auto', 'high', 'low'];
  let qi = FORCE_LITE ? 2 : 0;
  function applyQuality() {
    const q = QUALITY[qi];
    adaptOn = q === 'auto';
    if (q === 'low') {
      cloud.points.geometry.setDrawRange(0, Math.floor(COUNT * 0.4));
      cloud.uniforms.uSize.value = baseUSize * 1.35;
    } else {
      cloud.points.geometry.setDrawRange(0, COUNT);
      cloud.uniforms.uSize.value = baseUSize;
    }
    qBtn.textContent = q === 'auto' ? '画质·自动' : q === 'high' ? '画质·高' : '画质·低';
  }
  qBtn.addEventListener('click', () => { qi = (qi + 1) % QUALITY.length; applyQuality(); });
  applyQuality();

  document.getElementById('speed').addEventListener('input', (e) => {
    scene.setSpeed(parseFloat(e.target.value));
  });

  const vBtn = document.getElementById('btn-void');
  vBtn.addEventListener('click', () => {
    voidFishOn = !voidFishOn;
    vBtn.textContent = voidFishOn ? '拾句·开' : '拾句·关';
  });

  const viewBtn = document.getElementById('btn-view');
  let viewTarget = 0;
  viewBtn.addEventListener('click', () => {
    viewMode = viewMode === 'portrait' ? 'group' : 'portrait';
    viewTarget = viewMode === 'group' ? 1 : 0;
    viewBtn.textContent = viewMode === 'group' ? '视图·徽章' : '视图·肖像';
    capShown = -2;
  });

  function showQuote(globalIdx, { fished = false } = {}) {
    const q = quotes[globalIdx];
    const f = figureMap[q.f];
    card.show({
      quote: q, figure: f,
      index: globalIdx, total: TOTAL,
      fished,
      onNext: (quotesByFigure[q.f] || []).length > 1
        ? () => showQuote(nextSameFigure(q.f, globalIdx))
        : null,
      onCopy: () => navigator.clipboard.writeText(
        `“${q.t}” —— ${f.name},${q.w}${q.y ? `(${q.y})` : ''}`
      ).then(() => true, () => false),
      onShare: () => {
        history.replaceState(null, '', `#q=${globalIdx}`);
        return navigator.clipboard.writeText(location.href).then(() => true, () => false);
      },
      isFav: favs.has(globalIdx),
      onFav: () => {
        const on = favs.toggle(globalIdx);
        panel.renderFavs();
        return on;
      },
      onPostcard: () => savePostcard({ scene, quote: q, figure: f, index: globalIdx, total: TOTAL })
    });
  }
  function nextSameFigure(figureId, curIdx) {
    const list = quotesByFigure[figureId];
    const pos = list.indexOf(curIdx);
    return list[(pos + 1) % list.length];
  }
  function fishFromVoid() {
    // 点亮了某位思想家时,虚空里也只捞他/她的句子
    const focusId = cloud.uniforms.uFocus.value;
    const pool = focusId >= 0 ? quotesByFigure[figures[focusId].id] : null;
    if (pool && pool.length) showQuote(pool[(Math.random() * pool.length) | 0], { fished: true });
    else showQuote((Math.random() * TOTAL) | 0, { fished: true });
  }

  // ---------- 点击:星尘 → 该星语录;真空 → 捞起 ----------
  scene.onClick((x, y) => {
    const idx = scene.pickStar(x, y, 18);
    if (idx >= 0) showQuote(quoteIdxByParticle[idx]);
    else if (voidFishOn) fishFromVoid();
  });

  // ---------- 悬停气泡 ----------
  let hoverPending = false, lastHover = 0;
  canvas.addEventListener('pointermove', (e) => {
    if (hoverPending || scene.isDragging()) return;
    hoverPending = true;
    requestAnimationFrame(() => {
      hoverPending = false;
      const now = performance.now();
      if (now - lastHover < 40) return;
      lastHover = now;
      const idx = scene.pickStar(e.clientX, e.clientY, 14, 2);
      if (idx < 0) { hideTip(); return; }
      const q = quotes[quoteIdxByParticle[idx]];
      const f = figureMap[q.f];
      tooltip.innerHTML = `
        <span class="dot" style="--c:${f.color}"></span>
        <b>${f.name}</b>
        <span class="tip-text">${q.t.length > 30 ? q.t.slice(0, 30) + '……' : q.t}</span>
      `;
      tooltip.classList.add('show');
      const pad = 16;
      const tx = Math.min(e.clientX + pad, innerWidth - tooltip.offsetWidth - 10);
      const ty = Math.min(e.clientY + pad, innerHeight - tooltip.offsetHeight - 10);
      tooltip.style.transform = `translate(${tx}px, ${ty}px)`;
      canvas.style.cursor = 'pointer';
    });
  });
  canvas.addEventListener('pointerdown', hideTip);
  function hideTip() {
    tooltip.classList.remove('show');
    canvas.style.cursor = 'grab';
  }

  // ---------- 当前人物字幕(肖像成形时浮现) ----------
  let capShown = -2;
  function updateCaption(orient) {
    const show = orient.maxW > 0.55 ? orient.active : -1;
    if (show === capShown) return;
    capShown = show;
    if (show < 0) {
      captionEl.classList.remove('show');
    } else {
      if (viewMode === 'group') {
        const g = groups[show];
        captionEl.querySelector('.cap-name').textContent = g.label;
        captionEl.querySelector('.cap-sub').textContent =
          `${groupStats[show].figs} 位思想家 · ${groupStats[show].quotes} 句经典`;
        captionEl.style.setProperty('--c', '#e5484d');
      } else {
        const f = planeFigures[show];
        captionEl.querySelector('.cap-name').textContent = f.name;
        captionEl.querySelector('.cap-sub').textContent = `${f.years} · ${f.role}`;
        captionEl.style.setProperty('--c', f.color);
      }
      captionEl.classList.add('show');
    }
  }

  // ---------- 开场与加载 ----------
  const deepM = location.hash.match(/^#q=(\d+)$/);
  const deepIdx = deepM ? Math.min(TOTAL - 1, parseInt(deepM[1], 10) || 0) : -1;
  intro = initIntro(document.getElementById('intro'), {
    onEnter: () => scene.armAuto(),
    immediate: deepIdx >= 0
  });
  if (deepIdx >= 0) showQuote(deepIdx);
  if (!isMobile) body.classList.add('panel-open');

  let started = false;
  let fadeNow = performance.now();
  // 帧率自适应:持续低于 22fps 时逐步降低绘制粒子数(不影响拾取与数据)
  const levels = [1, 0.65, 0.45, 0.3, 0.2];
  let li = 0, fpsN = 0, fpsAcc = 0, lastNow = performance.now(), lastAdapt = performance.now();
  scene.onTick((dt, t, now) => {
    if (!started) {
      started = true;
      loading.classList.add('done');
      setTimeout(() => loading.remove(), 1200);
      setTimeout(() => hint.classList.add('fade'), 10000);
    }
    // 淡入按真实时间推进,不随帧率变化
    const realFadeDt = Math.min(2, (now - fadeNow) / 1000);
    fadeNow = now;
    const u = cloud.uniforms.uOpacity;
    u.value = Math.min(1, u.value + realFadeDt * 0.55);

    updateCaption(scene.getOrientation());
    const uV = cloud.uniforms.uView;
    uV.value += (viewTarget - uV.value) * Math.min(1, dt * 3);

    if (adaptOn && !FORCE_LITE && now - scene.lastRafAt < 1200) {
      const realDt = (now - lastNow) / 1000;
      lastNow = now;
      fpsAcc += realDt; fpsN++;
      if (now - lastAdapt > 2200 && fpsN >= 6) {
        const fps = fpsN / Math.max(1e-6, fpsAcc);
        if (fps < 22 && li < levels.length - 1) {
          li++;
          cloud.points.geometry.setDrawRange(0, Math.floor(COUNT * levels[li]));
        }
        fpsAcc = 0; fpsN = 0; lastAdapt = now;
      }
    }
  });

  // Esc 关闭语录卡;H 隐藏全部界面(截图);F 全屏
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') card.hide();
    else if (k === 'h') body.classList.toggle('chrome-off');
    else if (k === 'f') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    }
  });

  // 调试句柄(生产无副作用)
  window.__dbg = { scene, cloud, camera: scene.camera, quoteIdxByParticle, planeFigures };
};

boot().catch(err => {
  console.error(err);
  loading.innerHTML = `<div class="load-err">加载失败:${err.message}</div>`;
});
