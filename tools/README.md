# tools/ —— 离线生成脚本与输入素材

> 用途:说明三个脚本各产出什么、能不能重复跑、**哪些会覆盖已入库的文件**。
> 这里的东西不参与构建:`npm run build` 不会读 `tools/`,产物 `dist/` 里也没有它的任何文件。

三条流水线把照片和党徽底图变成运行时用得上的东西:
`prepare-mask.mjs` 出掩膜图(给 `src/core/mask.js` 采样用)、`make-emblem.mjs` 出徽章点位
(写进 `src/data/emblem.js`)、`make-banner.mjs` 出 README 横幅。
四个已入库的产物在没有本目录的情况下也能正常构建运行 —— 本目录只在需要重算时上场。

三个脚本都用 `import.meta.url` 反推仓库根,所以**在任何目录下运行都行**,命令写成
`node tools/<脚本名>` 即可,不需要先 `cd`。它们依赖 `jpeg-js` 与 `pngjs`(都在
`devDependencies` 里),所以必须先 `npm install`。

## 文件清单

| 文件 | 干什么 | 是否可重复运行 | 会不会覆盖已入库文件 |
|---|---|---|---|
| `prepare-mask.mjs` | 照片 → 亮度掩膜 | 可以,无随机数,同输入逐字节一致 | **会覆盖 `public/<id>-mask.png`**(4 张,已入库)。带 `--preview` 时只写 gitignore 的核对图,不动 `public/` |
| `make-emblem.mjs` | 党徽底图 → 采样点位 | 可以,但用了未播种的 `Math.random()`,每次点位都不同 | **会覆盖 `src/data/emblem.js`**(已入库,且被 `src/main.js` import)。另写 `tools/preview-emblem.png`(gitignore) |
| `make-banner.mjs` | 掩膜 → README 横幅 | 可以,同样带未播种随机数 | **会覆盖 `docs/banner.svg`**(已入库,README 顶部在用) |
| `marx-photo.jpg` 等 4 张 | `prepare-mask.mjs` 的输入照片 | — | 输入。4 张合计 3.19 MiB(复核:`node -e "const fs=require('fs');let t=0;for(const f of fs.readdirSync('tools'))if(/-photo\.jpg$/.test(f))t+=fs.statSync('tools/'+f).size;console.log(t)"`) |
| `emblem-ref.png` | `make-emblem.mjs` 的底图,1280×1280,CC0 党徽标准图形 | — | 输入 |

一句话记法:**唯一会写进 `src/data/` 的是 `make-emblem.mjs`**,它覆盖的是应用真正 import 的文件。
没有换照片、没有换底图就别重跑后两个脚本,那只会产出一堆与上一版无关的 diff。

## 三个脚本的用法

### `prepare-mask.mjs` —— 重算肖像掩膜

```bash
node tools/prepare-mask.mjs --only=marx --preview --debug   # 先看核对图,不动 public/
node tools/prepare-mask.mjs --only=marx                     # 确认后再真正写 public/marx-mask.png
node tools/prepare-mask.mjs                                # 四张全部重算
```

| 参数 | 作用 |
|---|---|
| `--only=<id>` | 只做一位(`marx` / `engels` / `lenin` / `luxemburg`) |
| `--preview` | 只写 `tools/preview-<id>.png`(掩膜上把分割边界描红),**不写 `public/`** |
| `--debug` | 打印背景占比与主体占比,用来判断泛洪分割有没有吃进脸 |

管线:按 `crop` 裁剪并区域平均下采样到宽 500 → 从图像边界做梯度感知的背景泛洪
(面部椭圆内永不为背景)→ 取含面部的连通块当主体 → 主体亮度 p10..p90 拉伸做自动曝光、
减掉大尺度低频得高频细节、按 `ped` 给剪影托底 → 边缘羽化与轻模糊 → 写灰度 PNG。

旋钮都在文件顶部的 `CONFIGS` 里:`crop` 归一化裁剪框、`face`/`faceR` 面部椭圆先验、
`bgTol`/`gradTol` 背景泛洪松紧、`cutY` 下沿切断、`detailGain` 五官加强、`gamma` 明暗反差、
`ped` 剪影托底。改完要跑,输出一行 `平均亮度 / 有效覆盖` 供比对
(当前四张分别是 95.8/52.0%、113.3/61.1%、111.1/65.4%、83.6/61.5%)。

**覆盖之后必须同步缓存串**:`src/main.js` 的 `PORTRAIT_PLANES` 里把对应那条的 `v` 加 1,
否则浏览器与 Pages 的 CDN 会继续发旧掩膜。这一步漏掉的现象是"改了掩膜但肖像没变"。

> 注意脚本开头的注释写着"p4..p96",与实现不符:代码取的是 10% 与 90% 百分位
> (复核:`grep -n "0.10\|0.90" tools/prepare-mask.mjs`)。以代码为准,别照注释调参。

### `make-emblem.mjs` —— 重算徽章点位

```bash
node tools/make-emblem.mjs              # 默认 3400 点,覆盖 src/data/emblem.js
node tools/make-emblem.mjs --n=5000     # 换点数
```

它把 `emblem-ref.png` 重采样成 460×460 二值掩膜,再按抖动网格取点,其中约 72% 落在轮廓上
(参数 `EDGE_RATIO`)、顶端另加 10% 当五角星(`STAR_SHARE`)。为什么偏重轮廓:粒子是加色发光的点,
让人认出镰刀锤头靠的是描边而不是填充。输出的坐标归一化到 `[-1,1]` 并按长边铺满。

跑完先看 `tools/preview-emblem.png` 认不认得出徽记,再 `git diff src/data/emblem.js`。
点数与运行时粒子数无关:着色器按分组各自循环取点,粒子比点多时同一点位会被复用,
所以调 `--n` 只是改变密度分布,不需要跟着改 `src/main.js` 的 `COUNT`。

### `make-banner.mjs` —— 重画 README 横幅

```bash
node tools/make-banner.mjs     # 读 public/marx-mask.png,覆盖 docs/banner.svg
```

1500 个星点按掩膜亮度加权采样,铺在 1200×500 的深底上,标题与四位思想家名字写死在脚本里。
只有换了马克思那张掩膜之后才需要重跑。

## 加第五位肖像:这个目录不够用

`CONFIGS` 里加一项就能生成第五张掩膜,但应用侧的四向结构是写死的
(`uW0..uW3`、`N = [0,1,2,3]`、着色器里的 `k·90°`),徽章视图也要求恰好四个分组。
所以"只跑脚本"加不出第五块肖像平面,原因与要动的文件见 [`../AGENTS.md`](../AGENTS.md) 的「关键约定 4」。

## 和谁打交道

- **上游**:照片与底图(人工挑选,来自 Wikimedia Commons 公有领域 / CC0 藏品)。
- **下游**:`../public/*-mask.png`、`../src/data/emblem.js`、`../docs/banner.svg`。
- **改这里之后要跑**:`npm run build`(确认还能构建),然后按上表去改对应的 `v` 与刷新文档数字。
  这三个脚本本身没有输出退出码约定,跑完 `node` 退出码 0 即成功。

## 别动

- 不要提交 `tools/preview-*.png`:它在 `.gitignore` 里,是核对用的中间图。
- 不要"顺手"给 `make-emblem.mjs` 或 `make-banner.mjs` 加时间戳或版本号 —— 它们本来就不产生
  逐字节稳定的输出,加了只会让 diff 更难读。真要稳定就给脚本补一个固定播种的随机数。
- 不要删 `emblem-ref.png` 或四张照片来给仓库瘦身:删掉之后掩膜与徽章就再也无法重算,
  而它们已经不在产物里,瘦身省不了用户下载的字节。
