# 思想云 上手手册

> 用途:给要真的把它跑起来或改它的人。每一步给命令、给本机实测输出、给出错时怎么办。
> 阅读顺序:第 1 到第 4 节按顺序做即可;第 5 节是改内容,第 6 节是发布,第 7、8 节备查。
> 术语第一次出现都有一句"它在这里干什么",第 8 节汇总。规模数字以 [`AGENTS.md`](../AGENTS.md) 为准。

## 1. 你需要准备什么

| 项目 | 要求 | 怎么确认 |
|---|---|---|
| 操作系统 | Windows / Linux / macOS 均可(本机实测 Windows) | — |
| Node.js | 能跑 Vite 5 的任意版本;本机实测 v24.19.0,CI 用 20 | `node --version` |
| npm | 随 Node 分发;本机实测 11.17.0 | `npm --version` |
| 第三方依赖 | 运行时只要 `three`,构建期要 `vite`/`jpeg-js`/`pngjs` | `npm ls --depth=0` |
| 浏览器 | 必须有 WebGL(第 7 节说明没有它会怎样) | 桌面浏览器保持"使用硬件加速"开启;远程桌面与虚拟机里常被关掉 |
| 网络 | 只为 `npm install`;运行与构建都不联网 | — |
| 密钥 / 账号 | 无。没有后端、没有数据库、没有登录 | — |

不需要 GPU 独显也能起来,但软件渲染会被自动降到 14000 颗粒子,体验明显变差。
照片与党徽底图约 3.2 MiB 已经在仓库里,不跑 `tools/` 下的脚本就用不到它们。

## 2. 装好它

```bash
git clone https://github.com/Luz7818/marx-cloud.git
cd marx-cloud
npm install
```

依赖已就位时本机输出:

```
up to date in 416ms

3 packages are looking for funding
  run `npm fund` for details
```

npm 11 还会打一行 `allow-scripts` 警告(esbuild 的 postinstall),实测不影响构建,忽略即可。
CI 里用的是 `npm ci`(按 `package-lock.json` 精确装 61 个包),本地一般不需要。
国内网络慢:`npm install --registry=https://registry.npmmirror.com`。

## 3. 三条命令

都在仓库根目录执行。

### 3.1 `npm run dev` —— 改代码用这个

```bash
npm run dev
```

本机输出:

```
> marx-cloud@1.0.0 dev
> vite


  VITE v5.4.21  ready in 319 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

打开 <http://localhost:5173/>。改 `src/` 下的文件刷新即生效。
端口被占用时 Vite 自己往后找,输出里会先有一行
`Port 5173 is in use, trying another one...`,然后给新端口(实测 5174)。
想让局域网里的手机也能访问,把脚本参数透传给 Vite:`npm run dev -- --host`
(注意:非 https 的局域网地址下"复制原文/分享"会失效,见第 7 节)。

### 3.2 `npm run build` —— 出静态产物

```bash
npm run build
```

本机输出(毫秒数与体积随数据变动):

```
> marx-cloud@1.0.0 build
> vite build

vite v5.4.21 building for production...
transforming...
✓ 16 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.98 kB │ gzip:   1.26 kB
dist/assets/index-BzJ6BFtw.css   12.40 kB │ gzip:   3.20 kB
dist/assets/index-DcHb7l6O.js   628.35 kB │ gzip: 211.50 kB
✓ built in 1.04s
```

通过标准:退出码 0、`✓ built in`,没有 `chunk size` 警告。
产物在 `dist/`(已 gitignore,不要提交):一个 HTML、一个 CSS、一个 JS,外加 Vite 从
`public/` 原样拷过去的 4 张掩膜 PNG 与那份 `README.md`,合计 1,646,445 字节
(复核:`du -sb dist | cut -f1`)。JS/CSS 文件名里的 hash 由内容决定,内容不变则 hash 不变。

`dist/` 是 gitignore 的本地产物,提交前不需要清理它。构建本身不跑类型检查,
所以还要挨个过一遍语法(在仓库根执行,无输出即全部通过):

```bash
for f in $(git ls-files 'src/*.js' 'tools/*.mjs' vite.config.js); do node --check "$f" || echo "FAIL $f"; done
```

### 3.3 `npm run preview` —— 验收产物

```bash
npm run preview
```

```
> marx-cloud@1.0.0 preview
> vite preview

  ➜  Local:   http://localhost:4173/
  ➜  Network: use --host to expose
```

它服务的是 `dist/` 而不是 `src/`,发布前用它确认一遍。改完代码只跑 `dev` 是不够的:
`dev` 不合并 chunk,也不拷 `public/`。

## 4. 怎么玩

### 4.1 开场

第一次打开是三页引导(致敬《诗云》),点任意处或按 `Enter` 下一页,右下角「跳过」直接进。
带 `#q=N` 进来会跳过引导并直接展开那一句。宽屏下左栏默认展开,窄屏与触屏默认收起。

### 4.2 输入一览(以代码实现为准)

| 输入 | 实现位置 | 效果 |
|---|---|---|
| 拖拽 / 单指滑动 | `src/core/scene.js` 的 `pointermove` | 转视角,每像素 0.005 弧度;俯仰被夹在 0.55–2.5 弧度之间 |
| 滚轮 | 同上 `wheel` | 以 `exp(deltaY × 0.0012)` 缩放,上下限是"刚好装下肖像"的 0.42–3.4 倍 |
| 双指捏合 | 同上,`pointers.size === 2` 分支 | 缩放,与滚轮同一套夹取范围 |
| `A` / `D` | `flyControls()` | 左右转向,1.5 弧度/秒 |
| `W` / `S` | `flyControls()` | 俯仰(升高 / 降低视角),1.1 弧度/秒 |
| `Q` / `E` | `flyControls()` | 拉近 / 推远,7 单位/秒 |
| `Shift` + 上面任一 | `state.shift` | 速度乘 2.2 |
| `P` | `src/core/scene.js` 的 `keydown` 分支 | 暂停 / 恢复自动巡游,相机停在原地 |
| `H` | `src/main.js` | 隐藏全部界面,只留星图(截图用) |
| `F` | 同上 | 全屏 / 退出全屏 |
| `Esc` | 同上 | 关闭语录卡 |
| `Enter` | `src/ui/intro.js` | 只在开场引导可见时翻页,进入星图后无作用 |
| 悬停一颗星 | `main.js` 的 `pointermove` | 气泡:人名 + 该句前 30 字。拾取半径 14 px,隔一个点取一个 |
| 点一颗星 | `scene.onClick` → `pickStar(x,y,18)` | 展开该句的语录卡。拾取半径 18 px |
| 点虚空 | 同上,拾取失败分支 | 随机捞一句,顶栏「拾句·开/关」可关 |
| 左栏点人名 | `panel.js` | 只留这个人的星(其余完全隐去,不是压暗)。会不会同时飞抵要看他/她有没有对应方位:肖像视图下只有那四位,徽章视图下按所属分组飞过去(`PORTRAIT_PLANES.findIndex` 返回 -1 时不动) |
| 左栏 `▸` | 同上 | 展开该人全部语录,点一句即定位(点亮 + 展开卡片) |
| 搜索框输完按 `Enter` | 同上 | 等同于点当前筛选结果里的第一个人 |
| 顶栏「视图·肖像/徽章」 | `main.js` | 在四向肖像与党徽两种星图之间切换 |
| 顶栏「画质·自动/高/低」 | 同上 | 低档只画前 40% 的粒子并把光点放大 1.35 倍 |
| 顶栏「速度」滑杆 | `scene.setSpeed()` | 自动巡游速度,0.4–2.4 倍,步长 0.2 |
| 顶栏「思想家列表」 | 切 `body.panel-open` | 开合左栏 |
| 顶栏「关于」 | 重开引导 | 再看一次开场三页 |
| 网址加 `#q=N` | `main.js` 解析 hash | 直达下标为 N 的那句(**从 0 起**,所以卡片显示"第 N+1 句") |
| 网址加 `?lite` | `main.js` | 粒子降到 9000 且初始就锁低画质档,关掉帧率自适应 |

**没有的键位**:切肖像、留影、拾遗都没有快捷键。切肖像是靠拖拽、自动巡游或左栏点人飞抵;
留影和收进拾遗是语录卡上的按钮。文档里不要凭印象补快捷键。
输入框(左栏搜索、速度滑杆)聚焦时,`WASDQE`/`P`/`H`/`F` 都不生效,不会挡住打字。

### 4.3 界面在做什么

- **每 90° 换人**:四块肖像平面互成直角。相机正对某块平面时权重才不为 0:视线与平面法线
  夹角小于 15.2° 时完全成形,超过 45.6° 就一点不剩,中间那段漫天星雾是有意的过渡
  (阈值 0.965 与 0.7 写在 `src/core/scene.js:246`,复核:`grep -n "smoothstep(0.7" src/core/scene.js`)。
- **自动巡游**:进入星图后开始。每个像位停留 9 秒,再用 8 秒 easeInOutCubic 转到下一位,
  一整圈约 68 秒(速度 1 倍)。任何拖拽或按键立即接管,停手 4 秒后恢复。
- **底部字幕**:只有正对某位思想家时才出现,给出姓名、生卒与身份;徽章视图下给出组名与
  "X 位思想家 · Y 句经典"。
- **两个视图**:肖像视图的四块平面对应马克思、恩格斯、列宁、卢森堡(按生卒年排序);
  徽章视图把同一套权重交给四个分组 —— 思想先驱 / 创始人 / 继承与发展 / 在中国,
  本组的星排成镰刀锤头加一颗五角星,其余三组被推到远处球壳上并压暗。
- **留影**:语录卡上点「留影」,把当前画面连同这一句排成 1200×1500 的竖版 PNG 下载,
  文件名带人名与句号。
- **拾遗**:语录卡「收进拾遗」写入本机 localStorage(键 `marxcloud.favs.v1`),左栏顶部出现列表,
  可一键清空。不跨设备、不上传。

## 5. 想改内容:五种常见改动

改完任何一项,都按第 9 节的命令验一遍。

### 5.1 加一句语录 / 改一句原文

编辑 [`src/data/quotes.js`](../src/data/quotes.js),它就是一个数组,一行一条:

```js
{ f: 'marx', w: '《资本论》第一卷', y: 1867, t: '劳动首先是人和自然之间的过程。' },
```

| 字段 | 含义 | 约束 |
|---|---|---|
| `f` | 人物 id | 必须是 `figures.js` 里已有的 `id`,写错不报错但侧栏找不到(见 `AGENTS.md` 约定 1) |
| `w` | 出处 | 任意字符串,不限书名号。写 `题词`、`《平等报》` 都有先例 |
| `y` | 年份 | 整数;确实不详写 `null`(现有 7 条如此,复核:`grep -c "y: null" src/data/quotes.js`) |
| `t` | 原文 | 中文正文,逗号用半角 `,` |

**只在数组末尾追加**。文件里的 `// ---------- 马克思 ----------` 与
`// ================= 第二辑:扩充 =================` 只是历史批次的注释,同一人散在多处不影响运行。
下标即编号:中间插入会让已分享的 `#q=N` 与别人本机的收藏整体错位。
加完核对下句数与最大下标:

```bash
node --input-type=module -e "const{quotes}=await import('./src/data/quotes.js');console.log(quotes.length,quotes.length-1)"
```

### 5.2 加一位思想家

编辑 [`src/data/figures.js`](../src/data/figures.js),在 `figures` 数组里加一项,九个字段都在被用:
`id`(英文小写,语录与掩膜文件名都靠它)、`name`、`en`、`years`(形如 `1818–1883`,连接号是 en dash)、
`region`、`role`、`group`、`color`(十六进制)、`blurb`(悬停时 title 里的那句话)。

- `group` 只能取 `pioneer` / `founders` / `inheritors` / `china` 四个 key 之一,写错会让页面直接崩
  (原因见 `AGENTS.md` 约定 6)。
- 想让人名以外也能搜到,在文件末尾的 `ALIAS` 表里按 id 加别名数组(字号、原名、另一通译)。
- 至少要给他/她配一条语录,否则星点会指向数组第 0 句(见 `AGENTS.md` 约定 1)。
- **不要给 `figures` 重排序**:粒子上存的是人物下标。

当前四组分布(复核:`node --input-type=module -e "const{quotes}=await import('./src/data/quotes.js');const{figures,groups}=await import('./src/data/figures.js');const c={};quotes.forEach(q=>c[q.f]=(c[q.f]||0)+1);for(const g of groups){const fs=figures.filter(f=>f.group===g.key);console.log(g.label,fs.length+'人',fs.reduce((a,f)=>a+(c[f.id]||0),0)+'句')}"`):
思想先驱 8 人 65 句、创始人 2 人 417 句、继承与发展 14 人 296 句、在中国 11 人 263 句。

### 5.3 换一张肖像掩膜

掩膜是一张 500 px 宽的灰度图:越亮的地方聚的星越多,黑色即无星。四张在 `public/`,
尺寸分别是 500×434 / 500×629 / 500×611 / 500×594,复核:

```bash
node -e "for(const i of ['marx','engels','lenin','luxemburg']){const p=require('pngjs').PNG.sync.read(require('fs').readFileSync('public/'+i+'-mask.png'));console.log(i,p.width+'x'+p.height)}"
```

```bash
cp 新照片.jpg tools/marx-photo.jpg         # 替换输入素材(名字要与 CONFIGS 里的 photo 一致)
node tools/prepare-mask.mjs --only=marx --preview --debug
```

先带 `--preview` 跑:它只写 `tools/preview-marx.png`(掩膜上描红分割边界,gitignore 内),
**不动 `public/`**。核对轮廓与五官后,去掉 `--preview` 重跑才会覆盖 `public/marx-mask.png`。
裁剪框与几个标定旋钮写在 `tools/prepare-mask.mjs` 的 `CONFIGS` 里(`crop` 是归一化比例,
`face`/`faceR` 是保护面部不被当成背景的椭圆先验,`bgTol`/`gradTol` 控背景泛洪的松紧,
`detailGain` 提五官,`ped` 给剪影托底,`gamma` 控明暗反差)。

覆盖之后必须同时改缓存串:`src/main.js` 的 `PORTRAIT_PLANES` 里把对应那条的 `v` 加 1,
否则浏览器与 Pages 的 CDN 会继续发旧图,看起来像"改了没生效"。

### 5.4 重算徽章点位

[`src/data/emblem.js`](../src/data/emblem.js) 是生成物,勿手改。它是 3400 个归一化坐标
(复核:`AGENTS.md`「数据规模」),着色时按分组顺序循环取用,粒子比点多时同一点位会被复用。

```bash
node tools/make-emblem.mjs            # 默认 3400 点
node tools/make-emblem.mjs --n=5000   # 改点数
```

它会写两个文件:`tools/preview-emblem.png`(gitignore 内的核对图)与
**`src/data/emblem.js`(入库文件,直接覆盖)**。底图是 `tools/emblem-ref.png`(1280×1280,CC0)。
脚本用了未播种的随机数,所以每次跑出来的点位都不一样 —— 没有换底图就别重跑,
否则 `git diff` 会出现一堆无意义的改动。粒子总数(28000)与这里无关,不用同步改。

### 5.5 重画 README 横幅

```bash
node tools/make-banner.mjs     # 读 public/marx-mask.png,覆盖 docs/banner.svg
```

同样带随机数,换掩膜之后才需要重跑。

## 6. 发布

### 6.1 GitHub Pages(当前在线入口)

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) 在 **push 到 `main`**
或手动触发时做这些事:

1. `actions/checkout@v4` 取代码;
2. `actions/setup-node@v4` 装 node 20 并缓存 npm;
3. `npm ci` → `npm run build`;
4. `actions/configure-pages@v5` + `actions/upload-pages-artifact@v3` 上传 `dist`;
5. 另一个 job 调 `actions/deploy-pages@v4` 发布,权限是 `pages: write`。

也就是说:**推 `main` 即上线,不需要手工步骤**,`dist/` 不入库也没关系(CI 自己构建)。
两个前提无法从本地复核,出问题先查它们:仓库的 Pages 来源必须设为 GitHub Actions
(GitHub 网页设置,不在仓库里);工作流是否跑绿要看 Actions 页面(本机没有 `gh`,
所以 `AGENTS.md` 里没写"CI 通过")。

改了 `public/` 下的掩膜却忘记 bump `?v=`,Pages 会继续发旧图 —— 这是最容易踩的一条。

### 6.2 `vercel.json`

仓库里还有一份 `vercel.json`(`npm ci` / `npm run build` / 输出 `dist`),它**不被 Pages 工作流读取**,
是给接入 Vercel 时用的参数。只要发布走 Pages,就不用动它。

## 7. 常见故障

| 现象 / 报错原文 | 原因 | 怎么办 |
|---|---|---|
| 页面停在"加载失败:……",下面是转圈的加载框 | WebGL 上下文拿不到(`THREE.WebGLRenderer` 抛错),本作没有兜底版本 | 换浏览器或开硬件加速;虚拟机/远程桌面里常被禁用。`detectSoftwareGL()` 只降粒子数,不解决"完全没有 GL" |
| `加载失败: 掩膜图加载失败: ./marx-mask.png?v=7` | `public/` 下没有对应文件,或 `PORTRAIT_PLANES` 的 id 与文件名不一致 | 文件名规律是 `<id>-mask.png`;改 id 要两处一起改 |
| `加载失败:Cannot read properties of undefined (reading '0')` | 刚改过 `figures.js`,某人 `group` 写了 `groups` 里没有的值 | 改成四个 key 之一;机制见 `AGENTS.md` 约定 6 |
| 左栏搜不到某个人 | 他的语录 `f` 写错 id,或 `group` 拼错导致整条不渲染 | 跑 `AGENTS.md` 约定 1 里的 id 核对命令,应输出 `0` |
| 重画掩膜后肖像没变化 | `?v=` 没变,拿的是缓存 | 改 `src/main.js` 里 `PORTRAIT_PLANES` 的 `v`,再构建 |
| 点星没反应 / 徽章视图下点不中 | 改过着色器或 `pickStar()` 却没同步另一份实现 | CPU 拾取是着色器公式的第二份实现,见 `AGENTS.md` 约定 5 |
| 点「复制原文」「分享」毫无反应,控制台有 TypeError | `navigator.clipboard` 只在 https 或 localhost 下存在 | 用 `http://localhost:5173/` 或线上 https 地址;手动复制原文文本 |
| 转 90° 不散开 / 聚不成像 | 相机在过渡带外或画质档被锁在低档,粒子太少 | 检查顶栏画质档;`?lite` 也会锁低档 |
| 越看越糊,掉到很低帧率回不来 | 帧率自适应只降不升(阈值 22 fps,阶梯到 20%) | 手动点顶栏「画质·高」或刷新 |
| 手机上没有左栏 | 触屏与窄屏默认收起,底部提示条也隐藏 | 点顶栏「思想家列表」,面板从底部升起 |
| `Port 5173 is in use, trying another one...` | 端口被占 | 正常提示,用输出里给的新端口 |
| `sh: vite: not found` 或 `npm run build` 报 ENOENT | 没装依赖 | `npm install`(或 `npm ci`) |
| 构建出现 `Some chunks are larger than 900 kB` | 数据涨了,超过 `vite.config.js` 里刻意抬到 900 的阈值 | 想消警告要么减数据,要么显式改 `build.rollupOptions`;别顺手把 900 调小 |
| `git status` 里出现 `dist/` 或 `tools/preview-*.png` | 不会发生:两者都在 `.gitignore` 里 | 若被强行 add 过,检查 `.gitignore` 是否被改 |

## 8. 术语小词典

| 词 | 在这份文档里指什么 |
|---|---|
| WebGL | 浏览器里直接驱动 GPU 画图形的接口。本项目所有画面都由它绘制,拿不到上下文就没有画面 |
| 软件渲染 | 没有 GPU 时用 CPU 假装 WebGL(如 SwiftShader、llvmpipe)。本项目检测到就少画一半粒子 |
| three.js / `THREE` | 封装 WebGL 的绘图库,本项目的运行时依赖只有它 |
| 点云 / 粒子 | 一堆各自有坐标和颜色的点,不加连线。这里每颗星就是一个粒子,数量 9000–28000 |
| 掩膜(mask) | 一张灰度图,亮度决定该处聚多少星。肖像不是模型,是从照片生成的掩膜采样出来的密度图 |
| 亮度 / 灰度 | 取掩膜的红色通道除以 255 当密度用(掩膜是灰度图,三个通道相同) |
| CDF 逆变换采样 | 先按亮度累加成"越亮占的区间越长"的表,再随机取一个落点。作用是亮处星密、暗处星疏 |
| 平面法线 | 一块肖像平面正 facing 的方向。四块平面法线互成 90°,相机朝向与它的夹角决定这平面成形多少 |
| 顶点着色器 / GLSL | 跑在 GPU 上、每颗粒子执行一次的程序。粒子的位置、大小、颜色都在里面算 |
| uniform / attribute | 传给着色器的两种变量:uniform 是每帧一个全局值(如相机权重),attribute 是每颗粒子各一份(如它的四块平面坐标) |
| 加色混合 | 两个光点重叠时亮度相加。好处是星有辉光,坏处是粒子太多会把肖像的暗部眼窝糊白,所以粒子数不能随便加 |
| 拾取(picking) | 把鼠标位置换算成"点中了哪颗粒子"。本项目在 CPU 上重算一遍着色器的位置公式再找最近邻 |
| 透视相机 | 近大远小的相机模型,本项目用的是 fov 50 的 `PerspectiveCamera`。肖像大小随距离变化就是它的效果 |
| 正交相机 | 无视距离、平行投影的相机,画出来像工程图。**本项目没有用它**,代码里只有透视相机 |
| `requestAnimationFrame`(rAF) | 浏览器逐帧回调。后台标签页或抓屏时会被节流,所以本项目另有一条 300 ms 的兜底驱动 |
| 深链 | 带 `#q=N` 的网址,别人打开就直接展开第 N+1 句。`N` 是 `quotes` 数组下标,从 0 起 |
| 缓存串 | URL 后面那段 `?v=7`。数字本身没含义,改它纯粹为了让浏览器与 CDN 重新拉图 |
| localStorage | 浏览器自带的本机键值存储,收藏写在这里,不上传、不跨设备 |
| chunk | 构建后合并出的 JS 文件。本项目只有一个,包含 three.js 与全部数据 |
| gzip | 服务器传输时压缩后的体积,比磁盘上的文件大小更接近用户实际下载量 |

## 9. 改完之后跑什么

```bash
npm run build
for f in $(git ls-files 'src/*.js' 'tools/*.mjs' vite.config.js); do node --check "$f" || echo "FAIL $f"; done
```

通过标准:`build` 退出码 0 且输出 `16 modules transformed`;`node --check` 一条 `FAIL` 都不打。
然后 `npm run preview`,把改过的东西在浏览器里实际操作一遍 —— 这个仓库没有自动化测试,
这一步就是回归。每条命令各自拦什么、哪些文件是生成物,写在仓库根的
[`AGENTS.md`](../AGENTS.md)。
