# 给 AI 的项目说明

> 用途:给 AI 编码助手。这里是事实与约束,不含介绍性文字。改动本仓库前先读这份。
> `README.md` 与 `docs/getting-started.md` 引用的规模数字以本文件为准,它们只链接不复述。

## 一句话

Vite 5 + 原生 ES Module + three.js 的单页 WebGL 作品:1041 句语录渲染成星尘,相机每转过 90°
聚合成一位思想家的肖像。构建产物是纯静态文件,没有后端、没有运行时服务、没有数据库。

## 当前真实状态

| 项 | 值 | 复核命令 |
|---|---|---|
| 构建 | 通过,`16 modules transformed`(这个数字跟源码模块数绑定,加一个 `.js` 就会变),约 1 秒 | `npm run build` |
| 产物 JS | 628.35 kB / gzip 211.50 kB | `npm run build` 末三行 |
| 产物 CSS | 12.40 kB / gzip 3.20 kB | `npm run build` 末三行 |
| 产物 HTML | 1.98 kB / gzip 1.26 kB | `npm run build` 末三行 |
| dist 全量 | 约 1.65 MB = hash 产物 730,996(JS 718,595 + CSS 12,401)+ `index.html` 2,388 + 4 张掩膜 909,306 + `README.md`(即 `public/README.md` 的体积,随文档改动而变,所以不写死总数) | `du -sb dist \| cut -f1`;分项 `du -sb dist/*` |
| 语法检查 | 16 个源码文件(`src` 12 + `tools` 3 + `vite.config.js`)全部通过 | `for f in $(git ls-files 'src/*.js' 'tools/*.mjs' vite.config.js); do node --check "$f" \|\| echo "FAIL $f"; done` |
| 自动化测试 | 无。scripts 只有 dev/build/preview | `node -e "console.log(Object.keys(require('./package.json').scripts))"` |
| lint / 类型检查 / 格式化 | 无配置也无依赖 | `git ls-files` 里没有 `eslint*`、`tsconfig*`、`prettier*` |
| 运行时依赖 | 只有 `three@0.169.0` | `npm ls --depth=0` |
| 安装期包数 | 61 个(lock 展开,含 devDependencies) | `node -e "console.log(Object.keys(require('./package-lock.json').packages).length-1)"` |
| 数据规模 | 1041 句语录 / 35 位人物 / 4 个分组 / 3400 个徽章点位 | `node --input-type=module -e "const q=(await import('./src/data/quotes.js')).quotes,{figures:f,groups:g}=(await import('./src/data/figures.js')),e=(await import('./src/data/emblem.js')).emblemPoints;console.log(q.length,f.length,g.length,e.length)"` |
| 代码规模 | `src/` 下 12 个 `.js` 共 2908 行,另有 `style.css` | `git ls-files 'src/*.js' \| wc -l`;`cat $(git ls-files 'src/*.js') \| wc -l` |
| 粒子数分档 | 桌面 28000 / 触屏或窄屏 20000 / 软件渲染 14000 / 带 `?lite` 9000 | `grep -n "const COUNT" src/main.js` |
| 自动巡游节拍 | 停留 9 秒 + 转场 8 秒,空闲 4 秒后恢复 | `grep -n "DWELL = 9" src/core/scene.js` |
| CI | 工作流只在 push `main` 或手动触发时跑;本机没有 `gh`,红绿灯状态无法复核,不要把它写成"CI 通过" | `.github/workflows/deploy.yml` |
| 线上版本 | HTTP 200,资源 hash 与本机 `npm run build` 一致 | `curl -s https://luz7818.github.io/marx-cloud/ \| grep -o 'assets/[a-zA-Z0-9._-]*' \| sort -u` |
| 本机环境 | node v24.19.0 / npm 11.17.0;CI 用 node 20 | `node --version && npm --version` |
| `dist/` | gitignore 的本地产物,不是交付物,不要提交 | `git check-ignore -v dist/index.html` |

## 仓库地图

| 路径 | 职责 | 关键点 |
|---|---|---|
| `index.html` | 唯一页面骨架与 DOM 契约 | 18 个 `id`,其中 14 个被 `src/main.js` 用 `getElementById` 取走,改名片刻就 `null` 报错。计数:`grep -o 'id="[a-z-]*"' index.html \| wc -l` |
| `vite.config.js` | 只有 `base: './'` 与 `chunkSizeWarningLimit: 900` | 相对 base 决定运行时请求掩膜的前缀,见「关键约定 3」 |
| `vercel.json` | Vercel 侧构建参数(`npm ci` / `npm run build` / `dist`) | 不被 GitHub Pages 工作流读取;实测在线入口是 Pages(见状态表) |
| `.github/workflows/deploy.yml` | 推 main → `npm ci` → `npm run build` → 发布 `dist` 到 Pages | 两个 job:`build` 上传产物,`deploy` 调 `deploy-pages@v4` |
| `src/main.js` | 装配层:索引数据、生成粒子属性、接线 UI 与场景、按键与自适应 | 不导出任何东西;`window.__dbg` 见「关键约定 9」 |
| `src/core/mask.js` | 从掩膜 PNG 反比例 CDF 采样星尘点位 | 导出 `samplePortrait` / `samplePortraits` |
| `src/core/cloud.js` | GLSL 粒子几何与材质:四块平面 + 徽章位 + 星云位 | 导出 `createCloud` / `createBackdrop` |
| `src/core/scene.js` | 渲染器、相机、指针/键盘、自动巡游、平面权重、CPU 拾取 | 导出 `createScene`,返回一个接口对象 |
| `src/ui/panel.js` | 左栏:搜索、点亮、语录目录、拾遗列表 | DOM 结构被 CSS 与自身 `querySelectorAll` 双重依赖 |
| `src/ui/quoteCard.js` | 语录卡的渲染与按钮回调 | 纯展示,不认识场景 |
| `src/ui/intro.js` | 三页开场引导 | 导出 `initIntro`,返回 `{reopen}` |
| `src/ui/favorites.js` | 拾遗读写 localStorage | 键 `marxcloud.favs.v1`,存的是语录下标 |
| `src/ui/postcard.js` | 「留影」导出 1200×1500 PNG | 依赖 `scene.renderNow()` 与 `<a download>` |
| `src/data/figures.js` | 35 位人物元数据 + 4 个分组 + 搜索别名 | 手工维护,`weight` 由语录数自动推导 |
| `src/data/quotes.js` | 1041 条语录数组 | 手工维护,顺序即编号,只在末尾追加 |
| `src/data/emblem.js` | 3400 个徽章点位 | `tools/make-emblem.mjs` 生成,勿手改 |
| `src/style.css` | 全部界面样式,单个 media query 管移动端 | 见「关键约定 8」的未定义类 |
| `public/*-mask.png` | 4 张亮度掩膜,运行时按 `./<id>-mask.png?v=<n>` 拉取 | 会被 Vite 原样拷进 `dist/` |
| `tools/*.mjs` | 三个离线生成脚本 | 只有 `make-emblem.mjs` 会写 `src/data/`,见「改动后的验证」 |
| `tools/*-photo.jpg`、`tools/emblem-ref.png` | 生成脚本的输入素材,合计 3.20 MiB | 不进构建、不被 `src/` 引用 |
| `docs/banner.svg` | README 横幅 | `tools/make-banner.mjs` 生成 |
| `package.json` | 只有 `dev` / `build` / `preview` 三条 scripts | 依赖:`three` 一个 runtime,`vite`/`jpeg-js`/`pngjs` 三个 dev |
| `package-lock.json` | lockfileVersion 3,61 个包 | CI 用 `npm ci` 按它精确装 |
| `.gitignore` | 挡掉 `node_modules/`、`dist/`、`tools/preview-*.png`、`.zcode/`、`*.log` | 掩膜与徽章点位**不在**这里,它们是入库的产物 |
| `LICENSE` | MIT,版权行写 2026 Luz7818 | — |

## 关键约定(违反会出问题的才写)

1. **`quotes[].f` 必须是 `figures[].id`**。这条没有任何校验(仓库里没有测试脚本)。
   写错 id 的后果:该句在侧栏目录与"同人物下一条"里永远不出现,但 `#q=N` 仍能打开它。
   反向同理:某人物若一条语录都没有,仍会按权重 1 分到星点,而它的 `quoteIdx` 兜底成 `0`,
   于是那颗星涂的是新人物的颜色、点开却是第 1 句马克思。核对:
   `node --input-type=module -e "const{quotes}=await import('./src/data/quotes.js');const{figureMap}=await import('./src/data/figures.js');console.log(quotes.filter(q=>!figureMap[q.f]).length)"`

2. **语录数组的下标就是对外编号**。`#q=N`、拾遗收藏、留影文件名用的都是 `quotes` 的 0 起下标。
   中间插入或删一条,会把已分享的深链、别人本机的收藏整体错位。所以只在文件末尾追加;
   删除只允许发生在纠错时,且要接受旧链接失效。注意 `#q=N` 是 0 起,卡片显示的"第 NNN 句"
   是 1 起,两者差 1。

3. **掩膜链路是 `figures[].id` → `PORTRAIT_PLANES[].id` → `public/<id>-mask.png` → `?v=`**。
   35 位人物里只有 4 位有掩膜(马克思、恩格斯、列宁、卢森堡),其余 31 位只有星群与色,
   不该去找他们的掩膜图。`src/main.js` 里 `{ id: 'marx', v: 7 }` 拼出请求 URL
   `./marx-mask.png?v=7`:id 三处必须一致,`v` 只是缓存串。重画掩膜后不改 `v`,
   Pages 的 CDN 与浏览器会继续发旧图,现象是"掩膜没生效"。
   生成规则:`${import.meta.env.BASE_URL}${id}-mask.png?v=${v}`,构建期 `BASE_URL` 被替换成 `./`。

4. **四向是写死的,不是配置**。`cloud.js` 用 `uW0..uW3` 四个 uniform、`scene.js` 用
   `N = [0,1,2,3]` 四块法线、着色器里 `k * 1.5707963`(即 90°)与 `groupPos(0..3)`。
   加第五块肖像平面要同时动 `src/core/cloud.js` 与 `src/core/scene.js`,只往数组里加一项没有用。
   徽章视图同理要求分组恰好 4 个。

5. **着色器和 CPU 拾取是同一套公式的两份实现**。`cloud.js` 的 GLSL `groupPos()` 与
   `scene.js` 里 JS 版 `groupPos()` 必须逐项一致(含 `13.7`/`11.3`/`3.7`/`9.13`/`7.31` 这些
   种子系数和 `0.18`、`0.82` 常数)。`pickStar()` 还直接读 `createCloud()` 返回的
   `positions / planePositions / cloudPos / seeds / groupIdx / emblem` —— 改字段名不会报错,
   只会让点击星尘静默失灵(散开态正常、徽章态点不中是典型信号)。

6. **`group` 字段只能取 `groups` 里那 4 个 key 之一**。写错的值让 `groupKeys.indexOf()` 返回 -1,
   `cloud.js` 里 `groupCursor[-1 % 4]` 取到 `undefined` → `ep[NaN]` 为 undefined → 读 `p[0]`
   抛 TypeError → `boot()` 整体失败,页面停在"加载失败"。同时 `panel.js` 的人物过滤
   (`figures.filter(f => f.group === g.key)`) 会让这个人从侧栏彻底消失。

7. **生成物清单**:`src/data/emblem.js`(由 `tools/make-emblem.mjs` 写)、
   `public/*-mask.png`(`tools/prepare-mask.mjs`)、`docs/banner.svg`(`tools/make-banner.mjs`)。
   `prepare-mask.mjs` 无随机,同一张照片重跑逐字节一致;`make-emblem.mjs` 与 `make-banner.mjs`
   用了未播种的 `Math.random()`,同一输入每次重跑都会产生 diff —— 没有真的换素材就别重跑。
   核对:`grep -c "Math.random" tools/prepare-mask.mjs tools/make-emblem.mjs tools/make-banner.mjs`
   (输出 0 / 2 / 5 行,即只有掩膜脚本没有随机)。

8. **`src/style.css` 里根本没有这几个类,但它们不是冗余**:
   - `.panel-row-wrap`:`panel.js` 用它做搜索过滤、回车首选、`.panel-row` 的 `parentElement.dataset.fig`
     定位高亮。删掉或扁平化 DOM,搜索与点亮态一起坏。
   - `.panel-group`:同一目录的 `querySelectorAll('.panel-group')` 靠它整组隐藏。
   - `.filtering`:只标状态,当前无人读取,属可观察用的挂点。
   核对:`grep -n "panel-row-wrap" src/style.css`(无输出)。样式在 `.panel-row` 上,和包装层重名
   只差 4 个字符,极易被当成笔误删掉。

9. **`window.__dbg` 是刻意保留的调试句柄**(`src/main.js` 末行,注释写明"生产无副作用")。
   它暴露 `scene / cloud / camera / quoteIdxByParticle / planeFigures`,是手工验证与截图复现
   的唯一入口,不要因为"生产环境不该挂全局变量"而删掉。

10. **中文正文用半角逗号**。全仓库(源码、`index.html`、文档)不出现全角逗号 U+FF0C,新增
     语录、注释与文档保持一致。核对(无输出即为 0;写成字节序列是为了不让命令本身命中):
     `grep -rl "$(printf '\xef\xbc\x8c')" src/ index.html README.md AGENTS.md docs/`

## 改动后的验证

| 动了什么 | 必须跑 | 通过判据 |
|---|---|---|
| 任意 `.js` | `for f in $(git ls-files 'src/*.js' 'tools/*.mjs' vite.config.js); do node --check "$f" || echo "FAIL $f"; done` | 无输出 |
| 任意代码 | `npm run build` | 退出码 0,`16 modules transformed`,无 `chunk size` 警告 |
| `src/data/quotes.js`、`src/data/figures.js` | 「数据规模」行的 node 命令 + 「关键约定 1」的 id 核对命令 | 句数与预期一致,且 id 核对输出 `0` |
| `public/*-mask.png` | 同时改 `src/main.js` 的 `v` → `npm run build` → `npm run preview` | 肖像轮廓对得上照片,转 90° 换人 |
| `tools/emblem-ref.png` 或 `make-emblem.mjs` | `node tools/make-emblem.mjs`(会覆盖 `src/data/emblem.js`) | 控制台点位仍是 3400,徽章视图能认出镰刀锤头 |
| `cloud.js` 或 `scene.js` 的位置公式 | `npm run dev` 后逐个姿态点星 | 成形/散开/徽章三种姿态都能点中,气泡与卡片同人同句 |
| `index.html` 的 DOM | `npm run dev`,开控制台 | 无 `null` 相关报错;`getElementById` 用到的 14 个 id 都还在 |
| 提交前 | `cd ../文档标准 && python check_docs.py Marx_Cloud` | 退出码 0,无阻断项 |

`npm run build` 只要约 1 秒,`npm run dev` 起在 5173、`npm run preview` 起在 4173,
真实输出与用法写在 [docs/getting-started.md](docs/getting-started.md)。

## 已知坑

- 粒子与语录的配对在每次加载时用 `Math.random()` 现算(`src/main.js` 的 boot 循环)。
  所以"某一颗星固定对应某一句话"不成立,同一颗星刷新后可能换一句。要稳定得改
  `quoteIdxByParticle` 的生成方式(播种随机),目前没有任何机制保证一致。
- `pickStar()` 是 O(粒子数) 的 CPU 遍历:28000 点每次点击全量算一遍,悬停时以
  `step = 2` 隔点采样并限流到 40 ms。别在 pointermove 里改成 `step = 1` 的密集拾取,
  高 DPI 屏上会明显掉帧。
- 没有 WebGL 就没有降级路径:`new THREE.WebGLRenderer()` 直接抛,`boot()` 的 catch 把
  `#loading` 换成"加载失败:<message>",开场引导压根没初始化。`detectSoftwareGL()` 只降粒子
  数,不解决"完全没有 GL"。
- `复制原文` 与 `分享` 调 `navigator.clipboard.writeText`,而 Clipboard API 只在安全上下文存在。
  用 `--host` 暴露成 http://局域网IP 时 `navigator.clipboard` 是 undefined,`onCopy()` 抛
  同步 TypeError,按钮点了没反应(报错只在控制台)。localhost 与 https 不受影响。
- 嵌入式 webview 冷启动时视口可能是 0×0,`resize()` 会跳过,靠 `frame()` 里逐帧的
  clientWidth 比对自愈;`setInterval` 300 ms 的兜底驱动只在 rAF 停摆时接管。删掉这两处
  会让"后台标签页/抓屏/自动化截图"里的画面冻住。
- 帧率自适应只在 `auto` 档生效,阈值 22 fps,阶梯 `[1, 0.65, 0.45, 0.3, 0.2]`,**只降不升**:
  掉下去之后即使帧率恢复也不会加回来,要恢复只能刷新或手动切画质档。
- `uSize` 桌面 0.195,移动端与软件渲染改成 0.26,而"低"画质档又乘 1.35。三处叠乘,
  单独调 `uSize` 默认值前先确认当前设备走的是哪条分支。
- 单 chunk 打包(three.js + 全部数据 628 kB),`chunkSizeWarningLimit: 900` 是刻意抬的。
  数据再加约 270 kB 才会重新出现体积警告 —— 想拆包要显式改 `build.rollupOptions`,别顺手"修"掉这个 900。
- `tools/prepare-mask.mjs` 开头的注释说"主体亮度 p4..p96 映射到 0..1",实现取的是
  **p10..p90**(`vals[floor(n*0.10)]` / `vals[floor(n*0.90)]`)。照注释去调自动曝光会调偏。
- npm 11 在本机会打 `allow-scripts` 警告(esbuild postinstall)。构建实测正常,不要为此改依赖。

## 不要做的事

- 不要为了"补齐工程化"引入测试框架、lint、TypeScript 或打包优化插件。这个仓库的门禁就是
  `node --check` + `npm run build` + 浏览器实测,加工具不等于有验证。
- 不要在 README 或手册里另写一套规模数字。所有数字改到上面的「当前真实状态」,其他文档指过来。
- 不要在没有换素材的前提下重跑 `tools/make-emblem.mjs` 或 `tools/make-banner.mjs`
  (见「关键约定 7」),那会产出与上一版无关但字节不同的 diff,看起来像"改过"。
- 不要把 `public/` 当纯静态资源目录:Vite 会整目录拷进 `dist/`,放进去的任何文件都会公开发布,
  包括本目录的 `README.md`。
- 不要动 `PORTRAIT_PLANES` 的数组长度(见「关键约定 4」),也不要"顺手"给 `figures` 重排序 ——
  `aFig` 存的是人物在 `figures` 里的下标,重排会把已分享的 `#q=N` 与收藏打乱(见「关键约定 2」)。
- 不要把 `dist/`、`tools/preview-*.png` 提交进来,它们是 gitignore 的本地产物。
