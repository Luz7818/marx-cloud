import './style.css';
import { samplePortrait, samplePortraits } from './core/mask.js';
import { createCloud, createBackdrop } from './core/cloud.js';
import { createScene } from './core/scene.js';
import { mulberry32, seedFromString, hash01 } from './core/rand.js';
import { figures, figureMap, groups } from './data/figures.js';
import { quotes } from './data/quotes.js';
import { portraits } from './data/portraits.js';
import { emblemPoints } from './data/emblem.js';
import { buildPanel } from './ui/panel.js';
import { initQuoteCard } from './ui/quoteCard.js';
import { initIntro } from './ui/intro.js';
import { initFavorites } from './ui/favorites.js';
import { savePostcard } from './ui/postcard.js';
import { avaHTML, hydrateAvas } from './ui/avatar.js';
import { toast } from './ui/toast.js';
import { copyText } from './ui/clipboard.js';

// ---------- DOM ----------
const canvas = document.getElementById('scene');
const tooltip = document.getElementById('tooltip');
const loading = document.getElementById('loading');
const hint = document.getElementById('hint');
const panelEl = document.getElementById('panel');
const captionEl = document.getElementById('figure-caption');
const capAvaSlot = document.getElementById('cap-ava');
const body = document.body;

let intro = null;
let voidFishOn = true;
const favs = initFavorites();
const btnPanel = document.getElementById('btn-panel');
btnPanel.addEventListener('click', () => {
  body.classList.toggle('panel-open');
  btnPanel.setAttribute('aria-expanded', body.classList.contains('panel-open'));
});
document.getElementById('btn-about').addEventListener('click', () => intro && intro.reopen());

// 回链只在作为子页面挂到别处时有意义:开发服务器或静态托管跑在站点根时, ../ 就是本页自己
{
  const back = document.querySelector('#brand .back');
  if (back) {
    const strip = (p) => p.replace(/index\.html$/, '');
    if (strip(new URL('../', location.href).pathname) === strip(location.pathname)) back.remove();
  }
}

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
const COUNT = FORCE_LITE ? 9000 : SOFT_GL ? 14000 : isMobile ? 20000 : 34000;
const PORTRAIT_H = 6.4;
const HALF = Math.PI / 2;

// 四块肖像平面:每 90° 一位,初始为四位旗舰;其余人物被选中时换装到最近的槽(见 ensurePortrait)
const PORTRAIT_PLANES = [
  { id: 'marx', v: 8 },
  { id: 'engels', v: 4 },
  { id: 'lenin', v: 4 },
  { id: 'luxemburg', v: 4 }
];
const planeFigs = PORTRAIT_PLANES.map(p => figureMap[p.id]);

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
  // 星↔句稳定配对:整条装配链(固定四掩膜采样 → 人物分配 → 配句 → 云层布局)
  // 共用同一颗种子,reload 后同一颗粒子读到同一句;换装人物各自派生独立种子(见 ensurePortrait)
  const rng = mulberry32(0x20261029);
  const planes = await samplePortraits(
    PORTRAIT_PLANES.map(p => `${import.meta.env.BASE_URL}${p.id}-mask.png?v=${p.v}`),
    COUNT,
    { rng }
  );
  const planeBrights = planes.map(p => p.bright);

  for (let i = 0; i < COUNT; i++) {
    const r = rng() * acc;
    let lo = 0, hi = figures.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (figCum[mid] < r) lo = mid + 1; else hi = mid;
    }
    const f = figures[lo];
    figIndexByParticle[i] = lo;
    groupIdxByParticle[i] = groupKeys.indexOf(f.group);
    const list = quotesByFigure[f.id] || [0];
    quoteIdxByParticle[i] = list[(rng() * list.length) | 0] || 0;
    colors[i] = f.color;
  }

  const cloud = createCloud({
    planes,
    figIndex: figIndexByParticle,
    groupIdx: groupIdxByParticle,
    emblem: emblemPoints,
    colors,
    height: PORTRAIT_H,
    rng
  });
  if (isMobile || SOFT_GL) cloud.uniforms.uSize.value = 0.26; // 小屏/软渲染下加大光点
  const backdrop = createBackdrop(isMobile ? 900 : 1500);
  const scenePlanes = planes.map(p => ({ w: PORTRAIT_H * p.aspect, h: PORTRAIT_H }));
  const scene = createScene(canvas, cloud, backdrop, { planes: scenePlanes });
  const attrFor = (slot) => cloud.points.geometry.attributes[slot === 0 ? 'position' : 'aP' + slot];

  // ---------- 肖像换装:把选中的思想家装进离相机最近的像位槽 ----------
  const morphCache = new Map();   // id → 采样结果(归一化点位/亮度/纵横比)
  let morphAnim = null;           // {attr, from, to, t0, dur} 位置渐变

  function nearestSlot() {
    return ((Math.round(scene.getTheta() / HALF) % 4) + 4) % 4;
  }

  function installSlot(slot, smp, fig) {
    const H = PORTRAIT_H, W = H * smp.aspect;
    const attr = attrFor(slot);
    const from = attr.array.slice();
    const to = new Float32Array(COUNT * 3);
    const th = slot * HALF, cos = Math.cos(th), sin = Math.sin(th);
    for (let i = 0; i < COUNT; i++) {
      const lx = smp.pts[i * 2] * W, ly = smp.pts[i * 2 + 1] * H;
      // 云层厚度用无状态哈希,与 createCloud 同式:同一粒子在同一槽位永远同一深度
      const lz = (hash01(i, 101 + slot) + hash01(i, 211 + slot) + hash01(i, 307 + slot) - 1.5) * 0.24;
      to[i * 3] = lx * cos + lz * sin;
      to[i * 3 + 1] = ly;
      to[i * 3 + 2] = -lx * sin + lz * cos;
    }
    morphAnim = { attr, from, to, t0: performance.now(), dur: 950 };

    // 亮度均值重算(换上来的掩膜参与四块均值,保持星点闪烁与新肖像一致)
    planeBrights[slot] = smp.bright;
    const brights = cloud.brights;
    for (let i = 0; i < COUNT; i++) {
      brights[i] = (planeBrights[0][i] + planeBrights[1][i] + planeBrights[2][i] + planeBrights[3][i]) / 4 * 0.7 + Math.random() * 0.3;
    }
    cloud.points.geometry.attributes.aBright.needsUpdate = true;

    planeFigs[slot] = fig;
    scenePlanes[slot] = { w: W, h: H };
    scene.refit();
  }

  async function ensurePortrait(id) {
    const p = portraits[id];
    if (!p || !p.mask) return false;
    const already = planeFigs.findIndex(pf => pf && pf.id === id);
    if (already >= 0) { scene.flyTo(already * HALF); return true; }
    let smp = morphCache.get(id);
    if (!smp) {
      const url = `${import.meta.env.BASE_URL}${p.mask}${p.v ? `?v=${p.v}` : ''}`;
      // 每位按需人物派生独立种子:无论何时首次点亮,采样结果都一致
      try { smp = await samplePortrait(url, COUNT, { rng: mulberry32(0x20261029 ^ seedFromString(id)) }); } catch { return false; }
      morphCache.set(id, smp);
    }
    const slot = nearestSlot();
    installSlot(slot, smp, figureMap[id]);
    scene.flyTo(slot * HALF);
    return true;
  }

  // ---------- UI ----------
  // ---------- 搜索/点选 → 点亮星群并飞抵 ----------
  let viewMode = 'portrait';   // 'portrait' | 'group'
  async function flyToFigure(id) {
    if (viewMode === 'group') {
      scene.flyTo(groupKeys.indexOf(figureMap[id].group) * HALF);
      return;
    }
    const ok = await ensurePortrait(id);
    if (!ok) {
      scene.flyTo(nearestSlot() * HALF);
      if (portraits[id] && portraits[id].mask) toast('星尘肖像加载失败,已保留单人星群', { tone: 'err' });
    }
  }

  // 点亮语义:有肖像可换装的人物 → 保留全员星尘只强调其色(uFocusDim=0);
  // 无肖像的人物 → 其余人的星完全隐去(uFocusDim=1,原行为)
  function applyFocus(id) {
    cloud.uniforms.uFocus.value = id == null ? -1 : figureIndex[id];
    cloud.uniforms.uFocusDim.value = id != null && !(portraits[id] && portraits[id].mask) ? 1 : 0;
    if (id == null) scene.armAuto(); else scene.disarmAuto();
  }

  const quoteCardEl = document.getElementById('quote-card');
  const card = initQuoteCard(quoteCardEl);
  const panel = buildPanel(panelEl, {
    counts,
    quotes,
    favs,
    onFilter: applyFocus,
    onSelect: flyToFigure,
    onPickQuote: (i) => { panel.select(quotes[i].f); showQuote(i); },
    openPanel: () => body.classList.add('panel-open')
  });

  // ---------- 顶栏控制:画质 / 巡游速度 / 随机拾句 ----------
  const baseUSize = cloud.uniforms.uSize.value;
  let adaptOn = true;
  const qBtn = document.getElementById('btn-quality');
  const qLabel = qBtn.querySelector('.btn-t');
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
    qLabel.textContent = q === 'auto' ? '画质·自动' : q === 'high' ? '画质·高' : '画质·低';
  }
  qBtn.addEventListener('click', () => { qi = (qi + 1) % QUALITY.length; applyQuality(); });
  applyQuality();

  document.getElementById('speed').addEventListener('input', (e) => {
    scene.setSpeed(parseFloat(e.target.value));
  });

  const vBtn = document.getElementById('btn-void');
  const vLabel = vBtn.querySelector('.btn-t');
  vBtn.setAttribute('aria-pressed', 'true'); // 拾句默认开启,按压态=功能开启
  vBtn.addEventListener('click', () => {
    voidFishOn = !voidFishOn;
    vLabel.textContent = voidFishOn ? '拾句·开' : '拾句·关';
    vBtn.classList.toggle('off', !voidFishOn);
    vBtn.setAttribute('aria-pressed', String(voidFishOn));
  });

  const viewBtn = document.getElementById('btn-view');
  const viewLabel = viewBtn.querySelector('.btn-t');
  let viewTarget = 0;
  viewBtn.addEventListener('click', () => {
    viewMode = viewMode === 'portrait' ? 'group' : 'portrait';
    viewTarget = viewMode === 'group' ? 1 : 0;
    viewLabel.textContent = viewMode === 'group' ? '视图·徽章' : '视图·肖像';
    capShown = -2;
  });

  let curQ = -1; // 当前展示的语录下标(←/→ 键导航用)
  function showQuote(globalIdx, { fished = false } = {}) {
    const q = quotes[globalIdx];
    const f = figureMap[q.f];
    const list = quotesByFigure[q.f] || [];
    curQ = globalIdx;
    card.show({
      quote: q, figure: f,
      index: globalIdx, total: TOTAL,
      fished,
      onNext: list.length > 1 ? () => showQuote(nextSameFigure(q.f, globalIdx)) : null,
      onPrev: list.length > 1 ? () => showQuote(prevSameFigure(q.f, globalIdx)) : null,
      onFigure: list.length > 1
        ? () => panel.openFigure(q.f)
        : null,
      onCopy: () => copyText(
        `“${q.t}” —— ${f.name},${q.w}${q.y ? `(${q.y})` : ''}`
      ),
      onShare: () => {
        history.replaceState(null, '', `#q=${globalIdx}`);
        const url = location.href;
        // 移动端优先调起系统分享面板;取消(AbortError)不打扰,其余失败回退复制链接
        if (navigator.share && window.isSecureContext) {
          return navigator.share({ title: '思想云 · Marx Cloud', text: `“${q.t}” —— ${f.name}`, url })
            .then(() => true)
            .catch((err) => {
              if (err && err.name === 'AbortError') return false;
              return copyText(url, { okMsg: '链接已复制,可直接分享' });
            });
        }
        return copyText(url, { okMsg: '链接已复制,可直接分享' });
      },
      isFav: favs.has(globalIdx),
      onFav: () => {
        const on = favs.toggle(globalIdx);
        panel.renderFavs();
        return on;
      },
      onPostcard: () => {
        try {
          savePostcard({ scene, quote: q, figure: f, index: globalIdx, total: TOTAL });
          toast('留影已开始下载');
        } catch (err) {
          toast('留影导出失败:' + err.message, { tone: 'err' });
        }
      }
    });
  }
  function nextSameFigure(figureId, curIdx) {
    const list = quotesByFigure[figureId];
    const pos = list.indexOf(curIdx);
    return list[(pos + 1) % list.length];
  }
  function prevSameFigure(figureId, curIdx) {
    const list = quotesByFigure[figureId];
    const pos = list.indexOf(curIdx);
    return list[(pos - 1 + list.length) % list.length];
  }
  function fishFromVoid() {
    // 点亮了某位思想家时,虚空里也只捞他/她的句子
    const focusId = cloud.uniforms.uFocus.value;
    const pool = focusId >= 0 ? quotesByFigure[figures[focusId].id] : null;
    if (pool && pool.length) showQuote(pool[(Math.random() * pool.length) | 0], { fished: true });
    else showQuote((Math.random() * TOTAL) | 0, { fished: true });
  }

  // ---------- 每日一句:按日期确定性取一句 ----------
  function dailyIdx() {
    const d = new Date();
    const seed = d.getFullYear() * 372 + (d.getMonth() + 1) * 31 + d.getDate();
    const r = (seed * 2654435761 % 4294967296 + 4294967296) % 4294967296;
    return Math.floor(r / 4294967296 * TOTAL) % TOTAL;
  }
  document.getElementById('btn-daily').addEventListener('click', () => showQuote(dailyIdx()));

  // ---------- 随机漫游:随机一位有肖像的思想家,飞抵并读一句(X 键 / 工具栏) ----------
  const portraitIds = Object.keys(portraits).filter(id => portraits[id].mask);
  function randomRoam() {
    if (viewMode === 'group') {
      // 徽章视图:飞往随机分组,并从该组人物里读一句(与按钮文案"飞往并读一句"一致)
      const k = (Math.random() * groupKeys.length) | 0;
      const figs = figures.filter(f => f.group === groupKeys[k]);
      const f = figs[(Math.random() * figs.length) | 0];
      scene.flyTo(k * HALF);
      const pool = quotesByFigure[f.id] || [];
      if (pool.length) showQuote(pool[(Math.random() * pool.length) | 0]);
      return;
    }
    const id = portraitIds[(Math.random() * portraitIds.length) | 0];
    if (!id) return;
    flyToFigure(id);
    const pool = quotesByFigure[id] || [];
    if (pool.length) showQuote(pool[(Math.random() * pool.length) | 0]);
  }
  document.getElementById('btn-random').addEventListener('click', randomRoam);

  // ---------- 快捷键帮助(? 键 / 工具栏问号) ----------
  const kbdHelp = document.getElementById('kbd-help');  function toggleHelp(force) {
    const show = force == null ? !kbdHelp.classList.contains('show') : !!force;
    kbdHelp.classList.toggle('show', show);
    requestAnimationFrame(() => kbdHelp.classList.toggle('vis', show));
  }
  document.getElementById('btn-help').addEventListener('click', (e) => {
    e.stopPropagation();
    toggleHelp();
  });
  kbdHelp.addEventListener('click', () => toggleHelp(false));

  // ---------- 点击:星尘 → 该星语录;真空 → 捞起 ----------  // 点亮的两种形态:uFocusDim=0 只做着色强调(全员星仍在,谁都可选);
  // uFocusDim=1 其余星完全隐去,此时只拾取被点亮者的星
  function pickAllowed(idx) {
    const f = cloud.uniforms.uFocus.value;
    if (f < 0) return true;
    if (cloud.uniforms.uFocusDim.value < 0.5) return true;
    return figIndexByParticle[idx] === f;
  }
  scene.onClick((x, y) => {
    const idx = scene.pickStar(x, y, 18);
    if (idx >= 0 && pickAllowed(idx)) showQuote(quoteIdxByParticle[idx]);
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
      if (idx < 0 || !pickAllowed(idx)) { hideTip(); return; }
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
  let capShown = '';
  function updateCaption(orient) {
    const show = orient.maxW > 0.55 ? orient.active : -1;
    const capKey = show < 0
      ? '-1'
      : viewMode === 'group'
        ? `group:${show}`
        : `figure:${show}:${planeFigs[show]?.id || ''}`;
    if (capKey === capShown) return;
    capShown = capKey;
    if (show < 0) {
      captionEl.classList.remove('show');
    } else {
      if (viewMode === 'group') {
        const g = groups[show];
        capAvaSlot.innerHTML = '';
        captionEl.querySelector('.cap-name').textContent = g.label;
        captionEl.querySelector('.cap-sub').textContent =
          `${groupStats[show].figs} 位思想家 · ${groupStats[show].quotes} 句经典`;
        captionEl.style.setProperty('--c', g.color);
      } else {
        const f = planeFigs[show];
        capAvaSlot.innerHTML = avaHTML(f.id, f.name, f.color, 'ava-cap');
        hydrateAvas(capAvaSlot);
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
    immediate: deepIdx >= 0,
    stats: `${figures.length} 位思想家,${TOTAL} 句经典`
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

    // 换装渐变:槽位粒子从旧肖像流向新肖像
    if (morphAnim) {
      const a = morphAnim;
      const mu = Math.min(1, (now - a.t0) / a.dur);
      const me = mu < 0.5 ? 4 * mu * mu * mu : 1 - Math.pow(-2 * mu + 2, 3) / 2;
      const arr = a.attr.array;
      for (let i = 0; i < arr.length; i++) arr[i] = a.from[i] + (a.to[i] - a.from[i]) * me;
      a.attr.needsUpdate = true;
      if (mu >= 1) morphAnim = null;
    }

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

  // Esc 关闭帮助/语录卡;←/→ 同人物上下一条;H 隐藏界面;F 全屏;R 每日一句;X 随机漫游
  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const k = e.key.toLowerCase();
    const helpShown = kbdHelp.classList.contains('show');
    if (e.key === 'Escape') {
      if (helpShown) toggleHelp(false);
      else card.hide();
    } else if (k === 'h') body.classList.toggle('chrome-off');
    else if (k === 'f') {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen?.();
    } else if (k === 'r') showQuote(dailyIdx());
    else if (k === 'x') randomRoam();
    else if (e.key === '?') toggleHelp();
    else if (e.key === '/') {
      // 快捷聚焦侧栏搜索:窄屏先升起抽屉
      e.preventDefault();
      body.classList.add('panel-open');
      const searchEl = panelEl.querySelector('.panel-search');
      if (searchEl && searchEl.style.display !== 'none') {
        searchEl.focus();
        searchEl.select();
      }
    }
    else if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && curQ >= 0
      && quoteCardEl.classList.contains('show')) {
      const list = quotesByFigure[quotes[curQ].f] || [];
      if (list.length > 1) {
        const pos = list.indexOf(curQ);
        const next = e.key === 'ArrowRight'
          ? list[(pos + 1) % list.length]
          : list[(pos - 1 + list.length) % list.length];
        showQuote(next);
      }
    }
  });

  // 调试句柄(生产无副作用)
  window.__dbg = { scene, cloud, camera: scene.camera, quoteIdxByParticle, planeFigs };
};

boot().catch(err => {
  console.error(err);
  loading.innerHTML = `<div class="load-err">加载失败:${err.message}</div>`;
});
