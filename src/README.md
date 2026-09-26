# src/ —— 全部前端代码

> 用途:说明这块目录里每个文件管哪一段、对外导出什么、改它之前要连带注意什么。

这里放的是构建进产物的所有代码:12 个 `.js` 加 1 个 `style.css`。入口是仓库根的
`index.html`,它只引 `<script type="module" src="/src/main.js">` 这一条,其余都由
`main.js` 串起来。没有框架、没有路由、没有打包外的运行时。

数据规模、构建产物体积、复核命令与完整约定集中在仓库根的
[`../AGENTS.md`](../AGENTS.md);本文件只讲"每个文件负责什么、接口是什么"。

## 文件清单

| 文件 | 干什么 | 对外的东西 |
|---|---|---|
| `main.js` | 装配层:建索引、按语录数加权分星、拼粒子属性、接线 UI 与场景、按键、帧率自适应 | 不导出任何东西。`window.__dbg` 是刻意留的调试句柄 |
| `style.css` | 全部界面样式(648 行,复核:`wc -l src/style.css`),含一个 `@media (max-width: 720px)` 管移动端 | 由 `main.js` 第一行 `import './style.css'` 引入 |
| `core/mask.js` | 把 `public/*-mask.png` 的亮度变成星尘点位 | `samplePortrait(url,count,opts)`、`samplePortraits(urls,count,opts)` |
| `core/cloud.js` | 建粒子几何与 GLSL 材质;另建远景静态星 | `createCloud(o)`、`createBackdrop(count)` |
| `core/scene.js` | 渲染器、相机、指针与键盘、自动巡游、四平面权重、CPU 拾取 | `createScene(canvas, cloud, backdrop, {planes})` |
| `ui/panel.js` | 左栏:搜索、点亮、语录目录、拾遗列表 | `buildPanel(container, opts)` → `{select, renderFavs}` |
| `ui/quoteCard.js` | 语录卡片的渲染与按钮回调 | `initQuoteCard(container)` → `{show, hide}` |
| `ui/intro.js` | 开场三页引导 | `initIntro(container, {onEnter, immediate})` → `{reopen}` |
| `ui/favorites.js` | 拾遗读写 localStorage | `initFavorites()` → `{has, list, toggle, clear}` |
| `ui/postcard.js` | 「留影」:当前画面 + 该句排成竖版图并下载 | `savePostcard({scene, quote, figure, index, total})` |
| `data/quotes.js` | 语录数组,手工维护 | `quotes` |
| `data/figures.js` | 人物元数据、分组、搜索别名,手工维护 | `figures`、`figureMap`、`groups` |
| `data/emblem.js` | 徽章视图的采样点位,**生成物** | `emblemPoints`,由 `../tools/make-emblem.mjs` 写出,勿手改 |

`main.js` 之外没有一个文件知道"整个应用"的样子:`core/*` 不认识语录,`ui/*` 不认识 WebGL,
`data/*` 不含逻辑。跨界的东西都集中在 `main.js`。

## src/core —— 渲染与拾取

三个文件构成一条流水线:`mask.js` 出点位 → `cloud.js` 出几何与材质 → `scene.js` 出画面与交互。

### `core/mask.js`

- 读一张灰度 PNG,取红色通道 / 255 当密度,先做 `floor = 0.04` 截断再按 `gamma = 1.35` 提对比,
  累加成 CDF;然后随机取 CDF 上的位置反查像素。结果是"亮的地方星多",不是硬阈值切割。
- 返回 `{pts, bright, aspect}`:`pts` 是 `count × 2` 的归一化坐标(`x∈[-0.5,0.5]`、`y` 向上为正),
  **不含世界尺寸**,由调用方按肖像高度换算;`aspect` 决定这块平面多宽。
- `samplePortraits(urls, count)` 按 `urls` 顺序逐个采样(本项目一次传四张),返回数组的
  下标就是"第几块平面"。
- 图片取不到时抛 `掩膜图加载失败: <url>`,这条文本会原样出现在页面上。

### `core/cloud.js`

- `createCloud(o)` 收 `{planes, figIndex, groupIdx, colors, emblem, height}`,一次算好 13 个
  attribute:`position`(0 号平面)、`aP1..aP3`(另三块平面)、`aCloudPos`(散开的星云位)、
  `aColorRest/aColorFull`(同一人物色的两个状态)、`aSize`、`aFig`、`aGroup`、`aEmblem`、`aSeed`、`aBright`。
- 平面坐标在 CPU 上按 `k·90°` 绕 Y 轴旋转写死进 buffer,着色器只做加权混合;
  13 个 uniform 里 `uW0..uW3` 是相机给的四个平面权重,`uView` 是肖像↔徽章的混合量,
  `uFocus` 是点亮的人物下标(-1 表示没点亮)。
- 材质是加色混合、不写深度、不测深度、`frustumCulled = false`。这三件事共同决定了
  "星多了会糊成一片",所以粒子数不能随手加。
- 返回 `{points, uniforms, count, positions, planePositions, cloudPos, seeds, groupIdx, emblem}` ——
  后面这几项是给 `scene.js` 的 CPU 拾取复算用的,改名字会静默弄坏点击。
- `createBackdrop(count)` 是独立的远景星,与本文件的粒子系统无耦合。

### `core/scene.js`

- `createScene()` 建 `WebGLRenderer`(不开抗锯齿)与 fov 50 的 `PerspectiveCamera`,
  相机始终看 `(0, 0.1, 0)`,位置由球坐标 `(theta, phi, radius)` 算出。
- 输入:单指/左键拖拽转视角,双指捏合与滚轮缩放,`WASDQE` 飞行(见 `../docs/getting-started.md` 第 4.2 节),
  `P` 暂停巡游。`fit` 是"四块平面都装得下"的距离,缩放被夹在它的 0.42–3.4 倍。
- 每帧把相机朝向与四块平面法线的点积过一遍 smoothstep,得到 `uW0..uW3`,并用
  `1 - maxWeight` 当散开量传给 `uSpread`。这是"每 90° 聚成人像"的全部机制,没有骨骼动画。
- `pickStar(clientX, clientY, maxPx, step)` 在 CPU 上把着色器那段位置计算重算一遍,
  再投影到屏幕找最近的一颗。**它是 `cloud.js` 里 GLSL 的第二份实现**,两边必须同步改。
- 返回 `{camera, renderer, onClick, onTick, pickStar, armAuto, setSpeed, renderNow, flyTo,
  getOrientation, lastRafAt, isDragging}`。`renderNow()` 只被留影用:必须在同一任务里先画再取画布。
- 两处自愈别删:视口为 0×0 时跳过 resize 并在每帧比对补一次;`setInterval` 300 ms 在 rAF
  被节流时顶一帧。原因写在代码注释里。

## src/ui —— 界面

五个文件都只碰 DOM,不 import three.js;`postcard.js` 是唯一需要 `scene` 实例的,由参数传入。

- `panel.js` 造出来的 DOM 有两条隐藏契约:`.panel-row-wrap` 必须是 `.panel-row` 的父节点
  (高亮靠 `parentElement.dataset.fig`),`.panel-group` 是整组显隐的单位。
  这两个类在 `style.css` 里根本没有规则 —— 它们是给 JS 用的钩子,不是冗余,别删。
- `quoteCard.js` 只认回调,不认场景:下一条、复制、分享、收藏、留影全部由 `main.js` 传进来。
- `intro.js` 的 `immediate: true` 会立刻跳过引导(带 `#q=N` 进来时就是这个分支)。
- `favorites.js` 存的是语录下标,键 `marxcloud.favs.v1`。隐私模式下写不进去,只影响持久化。
- `postcard.js` 用 `canvas.toDataURL` + `<a download>`,尺寸 1200×1500,折行按字宽逐字量
  (中文没有空格可断),字号从 52 px 往下试到行高能装下为止。

## src/data —— 语料与点位

| 文件 | 结构 | 谁在读 |
|---|---|---|
| `quotes.js` | `{f, w, y, t}` 数组,一行一条 | `main.js` 建索引、`panel.js` 出目录、卡片与留影取文本 |
| `figures.js` | `groups` 4 项、`figures` 35 项、`figureMap` 由 `figures` 派生 | `main.js` 配色与加权、`panel.js` 分组渲染与搜索 |
| `emblem.js` | `[x, y]` 数组,归一化到 `[-1,1]` | 只有 `cloud.js` 把它写进 `aEmblem` |

- **`f` 必须是 `figures` 里某个 `id`**,没有任何代码校验这件事;写错的表现见
  [`../AGENTS.md`](../AGENTS.md) 的「关键约定 1」。
- **数组下标是对外编号**:`#q=N`、收藏、留影文件名都用它。所以只在末尾追加,
  中间插入会让别人手里的链接错位。
- `y` 允许 `null`(表示年份不详),界面遇到 `null` 就不显示年份。
- `figures.js` 末尾的 `ALIAS` 表给每个人挂 `aka` 数组(字号、原名、另一通译),搜索会把
  `name / en / region / role / aka` 拼成一串来匹配;`ALIAS` 里没有的人 `aka` 是空数组,不用补。
- `emblem.js` 是 `tools/make-emblem.mjs` 的产物,重跑会覆盖它;别手改,也别在没有换
  底图时重跑(脚本带随机数,产出不逐字节稳定)。

## 和谁打交道

- **上游**:`../public/*-mask.png`(运行时按 `./<id>-mask.png?v=<n>` 拉取)、
  `../tools/` 生成的 `data/emblem.js`。
- **下游**:`npm run build` → `../dist/`(合并成一个 JS 加一个 CSS,`public/` 原样拷过去);
  GitHub Pages 工作流发布 `dist/`。
- **改这里之后要跑**:`npm run build`,再 `npm run preview` 在浏览器里实际操作一遍(没有自动化测试)。

## 别动

- `window.__dbg`(`main.js` 末行):手工验证与截图复现的唯一入口,注释里写明"生产无副作用"。
- `PORTRAIT_PLANES` 的四个条目与 `v` 字段:前者定义四块平面读哪张掩膜、顺序即 90° 的次序,
  后者是缓存串,重画掩膜必须一起改。
- `style.css` 里的 `.panel-row-wrap`、`.panel-group`:`src/ui/panel.js` 靠它们定位 DOM。
- `vite.config.js` 的 `chunkSizeWarningLimit: 900`(在仓库根):单 chunk 打包是刻意的,
  那个数字是为了不报无意义的警告。
