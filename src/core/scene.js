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
  return { nx: Math.sin(th), nz: Math.cos(th) };
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
    speed: 1,
    fly: null,
    paused: false,
    shift: false,
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
    state.fly = null;
    downX = e.clientX; downY = e.clientY; downT = performance.now();
    inputSinceFrame = true;
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
    inputSinceFrame = true;
    pumpOnInput();
  });

  const endPointer = (e) => {
    state.pointers.delete(e.pointerId);
    if (state.pointers.size === 0) state.dragging = false;
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (maxPointers === 1 && moved < 6 && performance.now() - downT < 500) {
      clickHandlers.forEach(fn => fn(e.clientX, e.clientY, e));
    }
    if (state.pointers.size === 0) maxPointers = 0;
    inputSinceFrame = true;
    pumpOnInput();
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', (e) => { state.pointers.delete(e.pointerId); if (!state.pointers.size) state.dragging = false; });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    state.lastInteract = performance.now();
    state.fly = null;
    state.radius = clamp(state.radius * Math.exp(e.deltaY * 0.0012), state.fit * 0.42, state.fit * 3.4);
    inputSinceFrame = true;
    pumpOnInput();
  }, { passive: false });

  // ---- 键盘飞行:WASD 转向、QE 进退、P 暂停巡游(输入框内不劫持按键) ----
  const keys = new Set();
  const isField = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  window.addEventListener('keydown', (e) => {
    if (isField(e.target)) return;
    const k = e.key.toLowerCase();
    state.shift = e.shiftKey;
    if ('wasdqe'.includes(k)) {
      keys.add(k);
      state.lastInteract = performance.now();
      state.fly = null;
      e.preventDefault();
    } else if (k === 'p') {
      state.paused = !state.paused;
    }
  });
  window.addEventListener('keyup', (e) => { keys.delete(e.key.toLowerCase()); state.shift = e.shiftKey; });
  window.addEventListener('blur', () => keys.clear());

  function flyControls(dt) {
    if (!keys.size) return;
    const fast = state.shift ? 2.2 : 1;
    const yaw = 1.5 * fast * dt, pit = 1.1 * fast * dt, dol = 7 * fast * dt;
    if (keys.has('a')) state.theta += yaw;
    if (keys.has('d')) state.theta -= yaw;
    if (keys.has('w')) state.phi = clamp(state.phi - pit, 0.55, 2.5);
    if (keys.has('s')) state.phi = clamp(state.phi + pit, 0.55, 2.5);
    if (keys.has('q')) state.radius = clamp(state.radius - dol, state.fit * 0.42, state.fit * 3.4);
    if (keys.has('e')) state.radius = clamp(state.radius + dol, state.fit * 0.42, state.fit * 3.4);
    state.lastInteract = performance.now();
    inputSinceFrame = true;
  }

  // ---- 渲染循环 ----
  const tickFns = [];
  const dir = new THREE.Vector3();
  let prev = performance.now();
  let lastFrameAt = 0;
  let lastRafAt = 0;

  function frame(now, pumped = false) {
    lastFrameAt = now;
    if (!pumped) lastRafAt = now;
    const dt = Math.max(0, Math.min(0.05, (now - prev) / 1000));
    prev = now;
    const t = now / 1000;

    // 视口尺寸逐帧自愈(嵌入式 webview 冷启动 0×0 的场景)
    if (canvas.clientWidth !== state.vw || canvas.clientHeight !== state.vh) resize();

    // 键盘飞行(与自动巡游互斥:按键即接管)
    flyControls(dt);

    // 飞抵:平滑转到目标方位角(取与当前最近的等价角)
    if (state.fly) {
      state.fly.t += dt;
      const u = Math.min(1, state.fly.t / state.fly.dur);
      const e = u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
      state.theta = state.fly.from + (state.fly.to - state.fly.from) * e;
      if (u >= 1) state.fly = null;
    }

    // 自动巡游:开场进入后武装;空闲 4 秒起,像位停留 DWELL 后用 TRAVEL 转到下一位
    const idle = now - state.lastInteract > 4000;
    if (state.autoArmed && idle && !state.fly && !state.paused) {
      state.autoT += dt * state.speed;
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
    inputSinceFrame = false;
    tickFns.forEach(fn => fn(dt, t, now));
    // 泵动帧不再注册 rAF:节流环境里否则每次泵动都会多留一个待触发回调,恢复时成倍渲染
    if (!pumped) requestAnimationFrame((n) => frame(n, false));
  }
  requestAnimationFrame((n) => frame(n, false));
  // 兜底驱动:rAF 被节流的环境(后台标签、自动化截图、OBS 抓屏)仍保持画面可用
  setInterval(() => {
    const n = performance.now();
    if (n - lastFrameAt > 400) frame(n, true);
  }, 300);

  // rAF 停摆的 webview 里,拖拽/滚轮必须自己出画,否则改了角度却看不到动静。
  // 用「输入未出画」标记而非时间差判定:循环正常时下一帧就会清掉,不会多渲染。
  let inputSinceFrame = false;
  function pumpOnInput() {
    if (!inputSinceFrame) return;
    inputSinceFrame = false;
    frame(performance.now(), true);
  }

  // ---- 拾取:CPU 复算着色器位置 → 屏幕空间最近邻,任何姿态(成形/散开/徽章)都可用 ----
  const fract = (v) => v - Math.floor(v);
  let groupCache = null;   // 四团星位缓存(与相机无关,只算一次)
  function pickStar(clientX, clientY, maxPx = 18, step = 1) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return -1;
    const px = clientX - rect.left, py = clientY - rect.top;
    const P = camera.projectionMatrix.elements, V = camera.matrixWorldInverse.elements;
    const u = cloud.uniforms;
    const w0 = u.uW0.value, w1 = u.uW1.value, w2 = u.uW2.value, w3 = u.uW3.value;
    const sp0 = u.uSpread.value, uv = u.uView.value;
    const emScale = u.uEmScale.value, haloR = u.uHaloR.value;
    const p0 = cloud.positions, p1 = cloud.planePositions[1], p2 = cloud.planePositions[2], p3 = cloud.planePositions[3];
    const cp = cloud.cloudPos, sd = cloud.seeds, gp = cloud.groupIdx, eb = cloud.emblem;
    const n = cloud.count;

    // 与着色器 groupPos 同公式:本组落在镰刀锤子上,其余组退为外晕球壳
    const groupPos = (k, seed, g, i, out) => {
      const mine = Math.abs(g - k) < 0.5 ? 1 : 0;
      const ca = Math.cos(k * 1.5707963), sa = Math.sin(k * 1.5707963);
      const ex = eb[i * 2] * emScale, ey = eb[i * 2 + 1] * emScale;
      const ez = (fract(seed * 13.7) - 0.5) * 0.18;
      const r = haloR * (0.95 + 0.45 * fract(seed * 11.3 + k * 0.07));
      const th = fract(seed * 3.7 + k * 0.31) * 6.2831853;
      const ph = Math.acos(2 * fract(seed * 9.13 + k * 0.17) - 1);
      const hx = Math.sin(ph) * Math.cos(th) * r, hy = Math.cos(ph) * 0.82 * r, hz = Math.sin(ph) * Math.sin(th) * r;
      const mx = ex * ca + ez * sa, my = ey, mz = -ex * sa + ez * ca;
      out[0] = hx + (mx - hx) * mine;
      out[1] = hy + (my - hy) * mine;
      out[2] = hz + (mz - hz) * mine;
    };
    const g0 = [0, 0, 0], g1 = [0, 0, 0], g2 = [0, 0, 0], g3 = [0, 0, 0];
    if (uv > 0.001 && !groupCache) {
      groupCache = [0, 1, 2, 3].map(() => new Float32Array(n * 3));
      const tmp = [0, 0, 0];
      for (let i = 0; i < n; i++) {
        const seed = sd[i], g = gp[i];
        for (let k = 0; k < 4; k++) {
          groupPos(k, seed, g, i, tmp);
          const a = groupCache[k], j = i * 3;
          a[j] = tmp[0]; a[j + 1] = tmp[1]; a[j + 2] = tmp[2];
        }
      }
    }
    const gc = groupCache;

    let best = -1, bestD = maxPx * maxPx;
    for (let i = 0; i < n; i += step) {
      const k = i * 3;
      const seed = sd[i];
      let x = cp[k], y = cp[k + 1], z = cp[k + 2];
      if (uv > 0.001) {
        const c0 = gc[0], c1 = gc[1], c2 = gc[2], c3 = gc[3];
        g0[0] = c0[k]; g0[1] = c0[k + 1]; g0[2] = c0[k + 2];
        g1[0] = c1[k]; g1[1] = c1[k + 1]; g1[2] = c1[k + 2];
        g2[0] = c2[k]; g2[1] = c2[k + 1]; g2[2] = c2[k + 2];
        g3[0] = c3[k]; g3[1] = c3[k + 1]; g3[2] = c3[k + 2];
      }
      const m0x = p0[k] + (g0[0] - p0[k]) * uv, m0y = p0[k + 1] + (g0[1] - p0[k + 1]) * uv, m0z = p0[k + 2] + (g0[2] - p0[k + 2]) * uv;
      const m1x = p1[k] + (g1[0] - p1[k]) * uv, m1y = p1[k + 1] + (g1[1] - p1[k + 1]) * uv, m1z = p1[k + 2] + (g1[2] - p1[k + 2]) * uv;
      const m2x = p2[k] + (g2[0] - p2[k]) * uv, m2y = p2[k + 1] + (g2[1] - p2[k + 1]) * uv, m2z = p2[k + 2] + (g2[2] - p2[k + 2]) * uv;
      const m3x = p3[k] + (g3[0] - p3[k]) * uv, m3y = p3[k + 1] + (g3[1] - p3[k + 1]) * uv, m3z = p3[k + 2] + (g3[2] - p3[k + 2]) * uv;
      x += (m0x - x) * w0; y += (m0y - y) * w0; z += (m0z - z) * w0;
      x += (m1x - x) * w1; y += (m1y - y) * w1; z += (m1z - z) * w1;
      x += (m2x - x) * w2; y += (m2y - y) * w2; z += (m2z - z) * w2;
      x += (m3x - x) * w3; y += (m3y - y) * w3; z += (m3z - z) * w3;
      const sp = sp0 * (0.35 + 0.65 * fract(seed * 7.31));
      x += (cp[k] - x) * sp; y += (cp[k + 1] - y) * sp; z += (cp[k + 2] - z) * sp;
      const vz = V[2] * x + V[6] * y + V[10] * z + V[14];
      if (vz >= -0.5) continue;
      const vx = V[0] * x + V[4] * y + V[8] * z + V[12];
      const vy = V[1] * x + V[5] * y + V[9] * z + V[13];
      const cw = P[3] * vx + P[7] * vy + P[11] * vz + P[15];
      const sx = ((P[0] * vx + P[4] * vy + P[8] * vz + P[12]) / cw * 0.5 + 0.5) * rect.width;
      const sy = (-((P[1] * vx + P[5] * vy + P[9] * vz + P[13]) / cw) * 0.5 + 0.5) * rect.height;
      const dx = sx - px, dy = sy - py;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  return {
    camera, renderer,
    onClick(fn) { clickHandlers.push(fn); },
    onTick(fn) { tickFns.push(fn); },
    pickStar,
    armAuto() { state.autoArmed = true; },
    setSpeed(v) { state.speed = v; },
    renderNow() { frame(performance.now(), true); },
    flyTo(theta, dur = 1.6) {
      const TWO = Math.PI * 2;
      const to = theta + Math.round((state.theta - theta) / TWO) * TWO;
      state.fly = { from: state.theta, to, t: 0, dur };
      state.autoT = 0;
      state.traveling = false;
    },
    // 正对的像位:main.js 用它决定底部字幕
    getOrientation() { return { active: state.activePlane, maxW: state.maxW }; },
    get lastRafAt() { return lastRafAt; },
    isDragging() { return state.dragging; }
  };
}
