import * as THREE from 'three';

const VERT = /* glsl */ `
attribute vec3 aCloudPos;
attribute vec3 aP1;
attribute vec3 aP2;
attribute vec3 aP3;
attribute vec3 aColorRest;
attribute vec3 aColorFull;
attribute float aSize;
attribute float aFig;
attribute float aGroup;
attribute vec2 aEmblem;
attribute float aSeed;
attribute float aBright;
uniform float uTime;
uniform float uSpread;
uniform float uFocus;
uniform float uView;
uniform float uEmScale;
uniform float uHaloR;
uniform float uPx;
uniform float uSize;
uniform float uW0;
uniform float uW1;
uniform float uW2;
uniform float uW3;
varying vec3 vColor;
varying float vAlpha;

// 徽章视图下第 k 面:本组粒子排成镰刀锤头+齿轮+五角星,其余组退为外围暗晕球壳。
// 标志平面随 k 一起绕 Y 轴转 90°,与肖像平面同构;CPU 拾取复算同一公式。
vec3 groupPos(float k) {
  float mine = step(abs(aGroup - k), 0.5);
  float ex = aEmblem.x * uEmScale;
  float ey = aEmblem.y * uEmScale;
  float ez = (fract(aSeed * 13.7) - 0.5) * 0.18;
  float ca = cos(k * 1.5707963), sa = sin(k * 1.5707963);
  vec3 em = vec3(ex * ca + ez * sa, ey, -ex * sa + ez * ca);
  float r = uHaloR * (0.95 + 0.45 * fract(aSeed * 11.3 + k * 0.07));
  float th = fract(aSeed * 3.7 + k * 0.31) * 6.2831853;
  float ph = acos(2.0 * fract(aSeed * 9.13 + k * 0.17) - 1.0);
  vec3 halo = vec3(sin(ph) * cos(th), cos(ph) * 0.82, sin(ph) * sin(th)) * r;
  return mix(halo, em, mine);
}

void main() {
  // 肖像选择:四块互成 90° 的肖像平面,按相机朝向权重混合;
  // 徽章视图下每块平面替换为对应分组的徽章;无平面可见时权重全 0,粒子停留在星云位
  vec3 s0 = mix(position, groupPos(0.0), uView);
  vec3 s1 = mix(aP1, groupPos(1.0), uView);
  vec3 s2 = mix(aP2, groupPos(2.0), uView);
  vec3 s3 = mix(aP3, groupPos(3.0), uView);
  vec3 sel = aCloudPos;
  sel = mix(sel, s0, uW0);
  sel = mix(sel, s1, uW1);
  sel = mix(sel, s2, uW2);
  sel = mix(sel, s3, uW3);

  // 散开系数:整体 uSpread × 逐粒子错峰,回正时层次化聚合
  float sp = uSpread * (0.35 + 0.65 * fract(aSeed * 7.31));
  vec3 pos = mix(sel, aCloudPos, sp);

  // 散开时缓慢漂移;成形时轻微呼吸
  pos += sp * 0.55 * vec3(
    sin(uTime * 0.11 + aSeed * 40.0),
    cos(uTime * 0.13 + aSeed * 23.0),
    sin(uTime * 0.09 + aSeed * 61.0)
  );
  pos.xy += (1.0 - sp) * 0.045 * vec2(
    sin(uTime * 0.50 + aSeed * 80.0),
    cos(uTime * 0.43 + aSeed * 52.0)
  );

  float focusOn = step(0.0, uFocus);
  float isFocus = (uFocus < 0.0) ? 0.0 : step(abs(aFig - uFocus), 0.5);
  // 点亮某人时,其余人的星完全隐去(不是压暗)
  float dim = (uFocus < 0.0) ? 1.0 : isFocus;

  // 标志视图:非当前组既推远又压暗,免得外晕把标志轮廓淹掉
  float gdim = 1.0 - 0.93 * uView * (
    uW0 * (1.0 - step(abs(aGroup - 0.0), 0.5)) +
    uW1 * (1.0 - step(abs(aGroup - 1.0), 0.5)) +
    uW2 * (1.0 - step(abs(aGroup - 2.0), 0.5)) +
    uW3 * (1.0 - step(abs(aGroup - 3.0), 0.5)));

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;

  float tw = 0.72 + 0.28 * sin(uTime * (0.6 + aSeed * 1.7) + aSeed * 100.0);
  float sz = uSize * aSize * (1.0 + focusOn * isFocus * 0.9);
  gl_PointSize = sz * uPx * (140.0 / max(0.001, -mv.z));

  vColor = mix(aColorRest, aColorFull, focusOn * isFocus) * dim * mix(1.0, 0.55, 1.0 - gdim);
  vAlpha = tw * dim * gdim * (0.62 + 0.38 * aBright);
}
`;

const FRAG = /* glsl */ `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
uniform float uOpacity;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float a = smoothstep(0.5, 0.02, d);
  a = pow(a, 2.2);
  // 白热核心要小且弱:否则加色混合会把眼窝、眉须这些"暗部空洞"重新糊白
  vec3 col = vColor + vec3(0.85) * smoothstep(0.20, 0.0, d) * 0.30;
  gl_FragColor = vec4(col, a * vAlpha * uOpacity);
}
`;

/** 标志视图的外晕半径(CPU 拾取经 uHaloR 共用同一值) */
const GROUP_HALO_R = 9.2;

/**
 * 构建思想星云:每位思想家一块肖像平面,互成 90° 环绕 Y 轴,
 * 相机方位角决定哪一块成形(权重经 uW0..uW3 传入)。
 * @param {Object} o
 * @param {Array}        o.planes     [{pts, bright, aspect}] ×4,归一化肖像点位
 * @param {number[]}     o.figIndex   每粒子人物索引
 * @param {number[]}     o.groupIdx   每粒子分组索引(徽章视图)
 * @param {number[]}     o.quoteIdx   每粒子语录索引
 * @param {string[]}     o.colors     每粒子人物色 '#rrggbb'(静止/点亮两态由此派生)
 * @param {number}       o.height     肖像世界高度(各平面统一)
 */
export function createCloud(o) {
  const n = o.planes[0].bright.length;
  const H = o.height;
  const HALF_PI = Math.PI / 2;

  // 平面 k 的局部坐标 → 世界坐标:绕 Y 轴旋转 k·90°
  // wx = lx·cosθ + lz·sinθ;wz = -lx·sinθ + lz·cosθ
  const planePositions = o.planes.map((p, k) => {
    const W = H * p.aspect;
    const th = k * HALF_PI;
    const cos = Math.cos(th), sin = Math.sin(th);
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const lx = p.pts[i * 2] * W;
      const ly = p.pts[i * 2 + 1] * H;
      const lz = (Math.random() + Math.random() + Math.random() - 1.5) * 0.24; // 云层厚度
      arr[i * 3] = lx * cos + lz * sin;
      arr[i * 3 + 1] = ly;
      arr[i * 3 + 2] = -lx * sin + lz * cos;
    }
    return arr;
  });

  const position = planePositions[0];
  const aCloudPos = new Float32Array(n * 3);
  const aColorRest = new Float32Array(n * 3);
  const aColorFull = new Float32Array(n * 3);
  const aSize = new Float32Array(n);
  const aFig = new Float32Array(n);
  const aGroup = new Float32Array(n);
  const aEmblem = new Float32Array(n * 2);
  const aSeed = new Float32Array(n);
  const aBright = new Float32Array(n);
  const cRest = new THREE.Color();
  const cFull = new THREE.Color();
  const warm = new THREE.Color('#fff6ea');
  // 每组各自顺序取标志点位:同组粒子铺满标志,组与组之间互不抢占
  const ep = o.emblem || [];
  const groupCursor = [0, 0, 0, 0];

  for (let i = 0; i < n; i++) {
    // 散开位:随机椭球,近密远疏
    const r = 2.2 + Math.pow(Math.random(), 1.6) * 8.5;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    aCloudPos[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.25;
    aCloudPos[i * 3 + 1] = r * Math.cos(ph) * 0.8;
    aCloudPos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) * 1.4;

    cRest.set(o.colors[i]).lerp(warm, 0.68);
    cFull.set(o.colors[i]);
    aColorRest[i * 3] = cRest.r; aColorRest[i * 3 + 1] = cRest.g; aColorRest[i * 3 + 2] = cRest.b;
    aColorFull[i * 3] = cFull.r; aColorFull[i * 3 + 1] = cFull.g; aColorFull[i * 3 + 2] = cFull.b;

    const hero = Math.random() < 0.02;
    aSize[i] = hero ? 1.6 + Math.random() * 0.9 : 0.65 + Math.random() * 0.85;
    aFig[i] = o.figIndex[i];
    aGroup[i] = o.groupIdx[i];
    if (ep.length) {
      const p = ep[groupCursor[aGroup[i] % 4] % ep.length];
      groupCursor[aGroup[i] % 4]++;
      aEmblem[i * 2] = p[0];
      aEmblem[i * 2 + 1] = p[1];
    }
    aSeed[i] = Math.random();
    // 亮度取四块掩膜均值(粒子共享同一颗星)
    aBright[i] = hero ? 1.0 :
      (o.planes[0].bright[i] + o.planes[1].bright[i] + o.planes[2].bright[i] + o.planes[3].bright[i]) / 4 * 0.7 + Math.random() * 0.3;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('aP1', new THREE.BufferAttribute(planePositions[1], 3));
  geo.setAttribute('aP2', new THREE.BufferAttribute(planePositions[2], 3));
  geo.setAttribute('aP3', new THREE.BufferAttribute(planePositions[3], 3));
  geo.setAttribute('aCloudPos', new THREE.BufferAttribute(aCloudPos, 3));
  geo.setAttribute('aColorRest', new THREE.BufferAttribute(aColorRest, 3));
  geo.setAttribute('aColorFull', new THREE.BufferAttribute(aColorFull, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  geo.setAttribute('aFig', new THREE.BufferAttribute(aFig, 1));
  geo.setAttribute('aGroup', new THREE.BufferAttribute(aGroup, 1));
  geo.setAttribute('aEmblem', new THREE.BufferAttribute(aEmblem, 2));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  geo.setAttribute('aBright', new THREE.BufferAttribute(aBright, 1));

  const uniforms = {
    uTime: { value: 0 },
    uSpread: { value: 0 },
    uFocus: { value: -1 },
    uView: { value: 0 },
    uEmScale: { value: 3.05 },
    uHaloR: { value: GROUP_HALO_R },
    uPx: { value: Math.min(window.devicePixelRatio || 1, 2) },
    uSize: { value: 0.195 },
    uOpacity: { value: 0 },
    uW0: { value: 1 },
    uW1: { value: 0 },
    uW2: { value: 0 },
    uW3: { value: 0 }
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return {
    points, uniforms, count: n,
    positions: position, planePositions,
    cloudPos: aCloudPos, seeds: aSeed, groupIdx: aGroup, emblem: aEmblem
  };
}

/** 远景静态星辰 */
export function createBackdrop(count = 1400) {
  const pos = new Float32Array(count * 3);
  const aSize = new Float32Array(count);
  const aSeed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 46 + Math.random() * 26;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph);
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    aSize[i] = 0.4 + Math.random() * 1.1;
    aSeed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  const mat = new THREE.ShaderMaterial({
    vertexShader: /* glsl */ `
      attribute float aSize;
      attribute float aSeed;
      uniform float uTime;
      uniform float uPx;
      varying float vTw;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSize * uPx * (320.0 / max(0.001, -mv.z));
        vTw = 0.5 + 0.5 * sin(uTime * (0.3 + aSeed) + aSeed * 90.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision mediump float;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(vec3(0.75, 0.8, 0.95), a * (0.25 + 0.4 * vTw));
      }
    `,
    uniforms: { uTime: { value: 0 }, uPx: { value: Math.min(window.devicePixelRatio || 1, 2) } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, mat);
  return points;
}
