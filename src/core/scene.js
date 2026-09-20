import * as THREE from 'three';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, x) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// 四块肖像平面:法线朝向 k·90°(k=0 面向 +Z,即初始视角)
const N = [0, 1, 2, 3].map(k => {
  const th = (k * Math.PI) / 2;
  return { nx: Math.sin(th), nz: Math.cos(th), tx: Math.cos(th), tz: -Math.sin(th) };
});

export function createScene(canvas, cloud, backdrop, { planes }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setClearColor(new THREE.Color('#07080f'), 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  const target = new THREE.Vector3(0, 0.1, 0);
  scene.add(backdrop);
  scene.add(cloud.points);

  // ---- 自定义环绕状态 ----
  const state = {
    theta: 0, phi: 1.42,
    radius: 10,
    fit: 10,
    spread: 0,
    lastInteract: -1e9,
    dragging: false,
    pointers: new Map(),
    pinchDist: 0,
    // 自动巡游:像位停留 DWELL 秒 → TRAVEL 秒转到下一位
    autoArmed: false, autoT: 0, traveling: false, fromTheta: 0, toTheta: 0,
    // 朝向权重
    weights: [1, 0, 0, 0], activePlane: 0, maxW: 1
  };
  const DWELL = 9, TRAVEL = 8;

  function computeFit(aspect) {
    const tanHalf = Math.tan((camera.fov * Math.PI) / 360);
    let fit = 0;
    for (const p of planes) {
      const rH = p.h / (0.74 * 2 * tanHalf);
      const rW = p.w / (0.94 * 2 * tanHalf * aspect);
      fit = Math.max(fit, rH, rW);
    }
    return fit;
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    // 嵌入式 webview 启动瞬间视口可能为 0,此时跳过(逐帧自愈检查会补一次)
    if (!w || !h) return;
    const fit = computeFit(w / h);
    if (!Number.isFinite(fit)) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    state.fit = fit;
    state.radius = Number.isFinite(state.radius)
      ? clamp(state.radius, state.fit * 0.42, state.fit * 3.4)
      : state.fit; // 之前被污染成 NaN/Infinity 时自愈
    state.vw = w; state.vh = h;
  }
  window.addEventListener('resize', resize);
  resize();
  state.radius = Number.isFinite(state.radius) ? state.radius : state.fit;

  // ---- 指针交互 ----
  const clickHandlers = [];
  let downX = 0, downY = 0, downT = 0, maxPointers = 0;

  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch { /* 合成事件无真实 pointerId */ }
    state.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    maxPointers = Math.max(maxPointers, state.pointers.size);
    state.dragging = true;
    state.lastInteract = performance.now();
    downX = e.clientX; downY = e.clientY; downT = performance.now();
    if (state.pointers.size === 2) {
      const [a, b] = [...state.pointers.values()];
      state.pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });

  canvas.addEventListener('pointermove', (e) => {
    const p = state.pointers.get(e.pointerId);
    if (!p) { return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    state.lastInteract = performance.now();
    if (state.pointers.size === 1) {
      state.theta -= dx * 0.005;
      state.phi = clamp(state.phi - dy * 0.005, 0.55, 2.5);
    } else if (state.pointers.size === 2) {
      const [a, b] = [...state.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (state.pinchDist > 0) {
        state.radius = clamp(state.radius * (state.pinchDist / d), state.fit * 0.42, state.fit * 3.4);
      }
      state.pinchDist = d;
    }
  });

  const endPointer = (e) => {
    state.pointers.delete(e.pointerId);
    if (state.pointers.size === 0) state.dragging = false;
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (maxPointers === 1 && moved < 6 && performance.now() - downT < 500) {
      clickHandlers.forEach(fn => fn(e.clientX, e.clientY, e));
    }
    if (state.pointers.size === 0) maxPointers = 0;
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', (e) => { state.pointers.delete(e.pointerId); if (!state.pointers.size) state.dragging = false; });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.lastInteract = performance.now();
    state.radius = clamp(state.radius * Math.exp(e.deltaY * 0.0012), state.fit * 0.42, state.fit * 3.4);
  }, { passive: false });

  // ---- 渲染循环 ----
  const tickFns = [];
  const dir = new THREE.Vector3();
  let prev = performance.now();
  let lastFrameAt = 0;
  let lastRafAt = 0;

  function frame(now, pumped = false) {
    lastFrameAt = now;
    if (!pumped) lastRafAt = now;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    const t = now / 1000;

    // 视口尺寸逐帧自愈(嵌入式 webview 冷启动 0×0 的场景)
    if (canvas.clientWidth !== state.vw || canvas.clientHeight !== state.vh) resize();

    // 自动巡游:开场进入后武装;空闲 4 秒起,像位停留 DWELL 后用 TRAVEL 转到下一位
    const idle = now - state.lastInteract > 4000;
    if (state.autoArmed && idle) {
      state.autoT += dt;
      if (!state.traveling && state.autoT > DWELL) {
        state.traveling = true;
        state.autoT = 0;
        state.fromTheta = state.theta;
        const HALF = Math.PI / 2;
        state.toTheta = (Math.floor(state.theta / HALF) + 1) * HALF;
      }
      if (state.traveling) {
        const u = Math.min(1, state.autoT / TRAVEL);
        const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; // easeInOutCubic
        state.theta = state.fromTheta + (state.toTheta - state.fromTheta) * e;
        if (u >= 1) {
          state.traveling = false;
          state.autoT = 0;
          state.theta = state.toTheta % (Math.PI * 2);
        }
      }
    } else {
      state.autoT = 0;
      state.traveling = false;
    }

    // 空闲后轻微摇摄,让肖像保持呼吸感
    const swayAmp = lerp(state.swayAmp || 0, idle ? 1 : 0, Math.min(1, dt * 1.5));
    state.swayAmp = swayAmp;
    const swayTheta = Math.sin(t * 0.14) * 0.10 * swayAmp;
    const swayPhi = Math.sin(t * 0.1 + 1.3) * 0.05 * swayAmp;

    const th = state.theta + swayTheta;
    const ph = clamp(state.phi + swayPhi, 0.55, 2.5);
    const sp = Math.sin(ph);
    dir.set(sp * Math.sin(th), Math.cos(ph), sp * Math.cos(th));
    camera.position.copy(target).addScaledVector(dir, state.radius);
    camera.lookAt(target);

    // 相机朝向与四块肖像平面法线的夹角 → 各平面权重;45° 过渡区全部散成星云
    let maxW = 0, active = 0;
    for (let k = 0; k < 4; k++) {
      const facing = dir.x * N[k].nx + dir.z * N[k].nz;
      const w = facing <= 0.7 ? 0 : smoothstep(0.7, 0.965, facing);
      state.weights[k] = w;
      if (w > maxW) { maxW = w; active = k; }
    }
    state.maxW = maxW;
    state.activePlane = active;

    const spreadTarget = 1 - maxW;
    state.spread = lerp(state.spread, spreadTarget, Math.min(1, dt * 3.2));
    cloud.uniforms.uSpread.value = state.spread;
    cloud.uniforms.uW0.value = state.weights[0];
    cloud.uniforms.uW1.value = state.weights[1];
    cloud.uniforms.uW2.value = state.weights[2];
    cloud.uniforms.uW3.value = state.weights[3];
    cloud.uniforms.uTime.value = t;
    if (backdrop.material.uniforms) backdrop.material.uniforms.uTime.value = t;

    renderer.render(scene, camera);
    tickFns.forEach(fn => fn(dt, t, now));
    requestAnimationFrame((n) => frame(n, false));
  }
  requestAnimationFrame((n) => frame(n, false));
  // 兜底驱动:rAF 被节流的环境(后台标签、自动化截图、OBS 抓屏)仍保持画面可用
  setInterval(() => {
    const n = performance.now();
    if (n - lastFrameAt > 400) frame(n, true);
  }, 300);

  // ---- 拾取辅助:屏幕坐标 → 当前成形肖像平面的局部二维坐标 ----
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();
  function pickAt(clientX, clientY) {
    if (state.maxW < 0.5) return null;
    const k = state.activePlane;
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const denom = raycaster.ray.direction.x * N[k].nx + raycaster.ray.direction.z * N[k].nz;
    if (Math.abs(denom) < 1e-4) return null;
    const dist = -(raycaster.ray.origin.x * N[k].nx + raycaster.ray.origin.z * N[k].nz) / denom;
    if (!Number.isFinite(dist) || dist <= 0) return null;
    hit.copy(raycaster.ray.origin).addScaledVector(raycaster.ray.direction, dist);
    // 世界 → 平面局部(x 轴沿肖像横向,y 轴竖直)
    return { plane: k, x: hit.x * N[k].tx + hit.z * N[k].tz, y: hit.y };
  }

  return {
    canvas, camera, renderer,
    onClick(fn) { clickHandlers.push(fn); },
    onTick(fn) { tickFns.push(fn); },
    pickAt,
    armAuto() { state.autoArmed = true; },
    getOrientation() {
      return { weights: state.weights.slice(), active: state.activePlane, maxW: state.maxW, spread: state.spread };
    },
    get spread() { return state.spread; },
    get lastRafAt() { return lastRafAt; },
    isInteracting() { return state.dragging || performance.now() - state.lastInteract < 4000; }
  };
}

/**
 * 粒子二维空间索引,用于快速最近邻拾取(肖像成形时)。
 * positions 为所选平面的局部坐标 (x, y, 0)。
 */
export function buildPickGrid(positions, cell = 0.14) {
  const grid = new Map();
  const n = positions.length / 3;
  for (let i = 0; i < n; i++) {
    const key = `${Math.floor(positions[i * 3] / cell)},${Math.floor(positions[i * 3 + 1] / cell)}`;
    let arr = grid.get(key);
    if (!arr) { arr = []; grid.set(key, arr); }
    arr.push(i);
  }
  return {
    cell,
    nearest(x, y, maxDist = 0.16) {
      const gx = Math.floor(x / cell), gy = Math.floor(y / cell);
      let best = -1, bestD = maxDist * maxDist;
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          const arr = grid.get(`${gx + ox},${gy + oy}`);
          if (!arr) continue;
          for (let k = 0; k < arr.length; k++) {
            const i = arr[k];
            const dx = positions[i * 3] - x, dy = positions[i * 3 + 1] - y;
            const d = dx * dx + dy * dy;
            if (d < bestD) { bestD = d; best = i; }
          }
        }
      }
      return best;
    }
  };
}
