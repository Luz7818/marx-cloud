# 思想云 · Marx Cloud 架构

> 用途：给要理解或改动本仓结构的人。架构总览、目录结构与各文件职责、数据组织方式、模块依赖、
> 发布链路与关键约定都在这里。操作步骤在 `docs/GET-START.md`；数字口径在根目录 `AGENTS.md` 的「当前状态」。

## 架构总览

Vite 5 + 原生 ES Module + three.js 的单页 WebGL 作品：5897 句语录渲染成星尘，相机每转过 90°
聚合成一位思想家的肖像（91 位人物，点亮可换装）。构建产物是纯静态文件，没有后端、没有运行时
服务、没有数据库。装配层 `src/main.js` 把 `src/data/` 的语录/人物/点位灌进 `src/core/` 的
渲染与拾取，`src/ui/` 只认装配层给的回调；着色器里的位置公式与 CPU 拾取是同一套公式的两份实现。

## 目录结构与各文件职责

```
Marx_Cloud/
├── docs/                     文档目录（手册与专项规范 + README 横幅 banner.svg）
├── public/                   入库：4 张肖像掩膜 + 83 张侧栏头像 + 79 张换装掩膜（含署名）
├── src/                      全部前端代码：core/ 渲染与拾取、ui/ 界面、data/ 语料与点位
├── tools/                    离线脚本 + tools/gen/ 语录扩充流水线 + lib/ 共用图像管线 + 照片素材
├── dist/                     Vite 构建产物（gitignore，不入库）
└── index.html / vite.config.js / vercel.json / package*.json
```

| 路径 | 职责 | 关键点 |
|---|---|---|
| `index.html` | 唯一页面骨架与 DOM 契约 | 18 个 `id`，其中 14 个被 `src/main.js` 用 `getElementById` 取走，改名片刻就 `null` 报错 |
| `vite.config.js` | 只有 `base: './'` 与 `chunkSizeWarningLimit: 900` | 相对 base 决定运行时请求掩膜的前缀，见关键约定 3 |
| `vercel.json` | Vercel 侧构建参数 | 不被 GitHub Pages 工作流读取；实测在线入口是 Pages |
| `.github/workflows/deploy.yml` | 推 main → `npm ci` → `verify` → `build` → 发布 `dist` 到 Pages | 两个 job：`build` 上传产物，`deploy` 调 `deploy-pages@v4` |
| `src/main.js` | 装配层：索引数据、生成粒子属性、接线 UI 与场景、按键与自适应 | 不导出任何东西；`window.__dbg` 见关键约定 9 |
| `src/core/mask.js` | 从掩膜 PNG 反比例 CDF 采样星尘点位 | 导出 `samplePortrait` / `samplePortraits` |
| `src/core/cloud.js` | GLSL 粒子几何与材质：四块平面 + 徽章位 + 星云位 | 导出 `createCloud` / `createBackdrop` |
| `src/core/scene.js` | 渲染器、相机、指针/键盘、自动巡游、平面权重、CPU 拾取 | 导出 `createScene` |
| `src/ui/panel.js` | 左栏：搜索、点亮、语录目录、拾遗列表 | DOM 结构被 CSS 与自身 `querySelectorAll` 双重依赖 |
| `src/ui/quoteCard.js` / `intro.js` / `favorites.js` / `postcard.js` | 语录卡 / 开场引导 / 拾遗（localStorage）/ 留影导出 | favorites 键 `marxcloud.favs.v1`，存语录下标 |
| `src/data/figures.js` | 91 位人物元数据 + 4 个分组 + 搜索别名 | 手工维护，`weight` 由语录数自动推导 |
| `src/data/quotes.js` | 5897 条语录数组 | 末尾 4856 条由 `tools/gen/merge.mjs` 生成，顺序即编号，只在末尾追加 |
| `src/data/emblem.js` | 3400 个徽章点位 | `tools/make-emblem.mjs` 生成，勿手改 |
| `src/data/portraits.js` | 头像清单（人物 id → `public/avatars/*.jpg`） | 脚本生成；缺失的人物侧栏回退姓氏徽记 |
| `src/style.css` | 全部界面样式，单个 media query 管移动端 | 见关键约定 8 的未定义类 |
| `public/*-mask.png` | 4 张亮度掩膜，运行时按 `./<id>-mask.png?v=<n>` 拉取 | Vite 原样拷进 `dist/` |
| `public/avatars/`、`public/portraits/` | 83 张小头像 + 79 张换装掩膜（按需加载） | `public/portraits/CREDITS.md` 记录来源与授权 |
| `tools/*.mjs` | 离线脚本：verify-data / prepare-mask / make-emblem / make-banner / fetch-portraits / make-portraits | 只有 make-emblem 会写 `src/data/`；fetch/make-portraits 写 `public/` |
| `tools/gen/` | 数据扩充流水线：批次 ndjson + selfcheck + merge + coverage | 批次文件合并后仍留仓供追溯 |
| `tools/*-photo.jpg`、`emblem-ref.png` | 生成脚本的输入素材（3.20 MiB） | 不进构建、不被 `src/` 引用 |
| `docs/banner.svg` | README 横幅 | `tools/make-banner.mjs` 生成 |
| `package.json` / `package-lock.json` | 四条 scripts；runtime 依赖只有 `three@0.169.0` | CI 用 `npm ci` 按锁精确装 61 包 |
| `.gitignore` | 挡 `node_modules/`、`dist/`、`tools/preview-*.png`、`.vercel`、`.env*`、`.zcode/`、`*.log` | 掩膜与徽章点位**不在**这里——它们是入库的产物 |

## 数据组织方式

- **语录数组 `src/data/quotes.js` 的下标就是对外编号**：`#q=N`、拾遗收藏、留影文件名都用
  0 起下标；只在末尾追加（删除仅限纠错且接受旧链接失效）。`#q=N` 是 0 起，卡片显示的
  "第 NNN 句"是 1 起，差 1。
- **人物/分组**：`figures.js` 手工维护（91 位、4 组、搜索别名）；`group` 字段只能取
  `groups` 里 4 个 key 之一（写错的后果见关键约定 6）；不要重排 `figures`——`aFig` 存的是
  下标，重排会打乱已分享的 `#q=N` 与收藏。
- **生成物清单**：`src/data/emblem.js`（make-emblem.mjs）、`public/*-mask.png`
  （prepare-mask.mjs，无随机、重跑字节一致）、`docs/banner.svg`（make-banner.mjs）。
  make-emblem 与 make-banner 用未播种的 `Math.random()`——没有真换素材就别重跑。
- **语录扩充流水线（`tools/gen/`）**：批次 ndjson（`quotes-<组名>-<人物id>-<序号>.ndjson`，
  t 必须是真实可查的经典原文，宁少勿滥）→ `node tools/gen/selfcheck.mjs <组名>`（`--all`
  全量、`--post` 合并后自检）→ `node tools/gen/merge.mjs`（`--dry` 预览）追加到 quotes.js
  末尾。merge 以「行内容」判重，批内/批间重复会静默跳过——先跑 `selfcheck --all` 清零再合并。
  合并后必须 `npm run verify` + `npm run build`。`coverage.mjs` 打印每人物条数分布。

## 模块依赖关系

```
index.html（DOM 契约）
   └── src/main.js（装配：数据索引 → 粒子属性 → UI 接线 → 键盘/自适应）
         ├── src/core/scene.js（渲染器/相机/巡游/CPU 拾取）
         │      └── src/core/cloud.js（GLSL 几何与材质）← 同一套位置公式的两份实现，必须同步改
         ├── src/core/mask.js（掩膜采样）＋ src/data/*（语料与点位）
         └── src/ui/*（panel / quoteCard / intro / favorites / postcard，互不认识场景）
tools/*.mjs（离线）→ 写 src/data/emblem.js、public/ 掩膜与头像、docs/banner.svg
```

- `kv/gui` 式叶子不存在——`src/ui/*` 依赖 main.js 注入的回调，不反向 import core。
- `pickStar()` 直接读 `createCloud()` 返回的 `positions / planePositions / cloudPos / seeds /
  groupIdx / emblem`——改字段名不会报错，只会让点击静默失灵。

## 发布与收录

- GitHub Pages：`.github/workflows/deploy.yml` 推 main 触发 `npm ci → verify → build → deploy`。
- **luzzz.me 子页面收录**：其 `/marx-cloud/` 是本仓 `dist/` 的拷贝（由
  `luzzz.me/tools/sync-showcases.mjs` 生成），本仓改动不被反向覆盖。全站相对路径
  （`base: './'`）+ 访问 URL 以 `/` 结尾是两条硬约束；双击 `dist/index.html` 打不开
  （`type="module"` 在 `file://` 被 CORS 拦），只能 HTTP 起服务看。本仓 `dist/` 产物变化后，
  luzzz.me 侧需重跑同步（跨仓冻结路径，见其 AGENTS）。

## 子目录说明索引

| 子目录 | 说明 |
|---|---|
| `src/` | [src/README.md](../src/README.md)（core/data/ui 逐文件说明） |
| `public/` | [public/README.md](../public/README.md)（掩膜/头像/署名） |
| `tools/` | [tools/README.md](../tools/README.md)（脚本与素材） |
| `docs/` | 无（文档目录本身） |

## 关键约定（违反会出问题的）

1. **`quotes[].f` 必须是 `figures[].id`**：verify 逐条核对。写错的后果——该句在侧栏目录与
   "同人物下一条"里永不出现，但 `#q=N` 仍能打开；某人物零语录时仍按权重分到星点，
   `quoteIdx` 兜底成 0，那颗星涂新人物的颜色、点开却是第 1 句马克思。
2. **语录下标即对外编号**——见「数据组织方式」，只在末尾追加。
3. **掩膜链路是 `figures[].id` → `PORTRAIT_PLANES[].id` → `public/<id>-mask.png` → `?v=`**：
   91 位里只有 4 位有掩膜（马克思、恩格斯、列宁、卢森堡），其余 87 位只有星群与色，侧栏另
   有 83 位配小头像。id 三处必须一致；重画掩膜不改 `v` 会让 CDN/浏览器继续发旧图。
4. **四向是写死的，不是配置**：`uW0..uW3`、`N=[0,1,2,3]`、着色器 `k*1.5707963`、
   `groupPos(0..3)`。加第五块肖像要同时动 `cloud.js` 与 `scene.js`；徽章视图要求分组恰好 4 个。
5. **着色器与 CPU 拾取是同一套公式的两份实现**：GLSL `groupPos()` 与 JS 版必须逐项一致
   （含 `13.7/11.3/3.7/9.13/7.31` 种子系数与 `0.18/0.82` 常数）。
6. **`group` 写错 = 整页白屏**：`groupKeys.indexOf()` 返回 -1 → `ep[NaN]` → 读 `p[0]` 抛
   TypeError → `boot()` 失败，页面停在"加载失败"；该人物同时从侧栏消失。
7. **生成物清单与随机性**：见「数据组织方式」；`grep -c "Math.random"` 在 prepare-mask /
   make-emblem / make-banner 应输出 0 / 2 / 5。
8. **`style.css` 里没有 `.panel-row-wrap` / `.panel-group` / `.filtering`，但它们不是冗余**：
   panel.js 靠包装层 DOM 做搜索过滤与整组隐藏；`.filtering` 是可观察挂点。样式在
   `.panel-row` 上，重名只差 4 个字符，极易被当笔误删掉。
9. **`window.__dbg` 是刻意保留的调试句柄**（main.js 末行）：手工验证与截图复现的唯一入口，
   不要以"生产不该挂全局变量"为由删掉。
10. **本页被 luzzz.me 当子页面收录**：相对路径（`base: './'`、`../` 回链）+ URL 以 `/` 结尾
    两条硬约束，见「发布与收录」；回链只在确实有上一级时保留（main.js 自动判断）。
11. **中文正文用半角逗号**：全仓（源码、index.html、文档）不出现全角逗号 U+FF0C。核对
    （无输出即 0）：`grep -rl "$(printf '\xef\xbc\x8c')" src/ index.html README.md AGENTS.md docs/`

## 子目录说明之外的已知架构问题

- 没有 WebGL 就没有降级路径：`THREE.WebGLRenderer` 直接抛，只有粒子数降档、没有兜底版本。
- 粒子与语录的配对每次加载用 `Math.random()` 现算，"某颗星固定某句"不成立；要稳定需播种，
  目前无机制保证。
- 帧率自适应只在 `auto` 档生效且**只降不升**（阈值 22 fps，阶梯 `[1, 0.65, 0.45, 0.3, 0.2]`）。
- 单 chunk 打包（three + 数据 628 kB），`chunkSizeWarningLimit: 900` 是刻意抬的——想拆包要
  显式改 `build.rollupOptions`，别顺手"修"掉。
