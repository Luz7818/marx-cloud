# public/ —— 运行时拉取的肖像掩膜

> 用途:说明这四张 PNG 是谁生成的、运行时怎么被取到、动它要连带改什么。

这里放的是四张**亮度掩膜**:每位思想家一张,越亮的地方聚的星越多,纯黑处没有星。
肖像不是 3D 模型也不是贴图,而是从这些灰度图采样出来的点云密度图 —— 五官、胡须、
明暗全部来自本人照片,由 `tools/prepare-mask.mjs` 生成,跑法与风险见
[tools 目录说明](../tools/README.md)。

Vite 会把本目录整份原样拷进 `dist/` 根下:不打包、不改名、不加 hash。所以运行时请求的
URL 就是文件名本身,唯一的缓存控制手段是查询串里的 `?v=`。

## 文件清单

| 文件 | 对应人物 | 尺寸 | 字节数 |
|---|---|---|---|
| `marx-mask.png` | 卡尔·马克思 | 500×434 | 138,432 |
| `engels-mask.png` | 弗里德里希·恩格斯 | 500×629 | 223,803 |
| `lenin-mask.png` | 弗拉基米尔·列宁 | 500×611 | 277,936 |
| `luxemburg-mask.png` | 罗莎·卢森堡 | 500×594 | 269,135 |
| `README.md` | 本文件 | — | — |

合计 909,306 字节(复核:`node -e "const fs=require('fs');let t=0;for(const f of fs.readdirSync('public'))if(f.endsWith('.png'))t+=fs.statSync('public/'+f).size;console.log(t)"`)。
宽统一是 500,高由各自照片的裁剪比例决定,所以四块肖像平面的**宽度不同**
(`main.js` 里按 `PORTRAIT_H × aspect` 换算,相机取景取四者的最大值)。

## 谁在用

- [`../src/core/mask.js`](../src/README.md):`samplePortraits(urls, count)` 把每张图按亮度
  累加成 CDF,再随机反查像素取 `count` 个点。取的是红色通道 / 255 当密度(图是灰度,三通道相同)。
- [`../src/main.js`](../src/README.md):拼 URL 的地方 ——
  `${import.meta.env.BASE_URL}${p.id}-mask.png?v=${p.v}`,构建期 `BASE_URL` 是 `./`,
  所以线上实际请求是 `./marx-mask.png?v=7`。
- 加载失败会让整个页面停在"加载失败:掩膜图加载失败: …",没有兜底画面。

## 三条必须一起动的规矩

1. **文件名必须是 `<id>-mask.png`**,`id` 要能在 `src/data/figures.js` 里找到,
   且出现在 `src/main.js` 的 `PORTRAIT_PLANES` 中。三处任一不一致,表现分别是取不到图、
   侧栏点不到、请求 404。
2. **重画或替换掩膜后必须把对应的 `v` 加 1**。`?v=` 没有任何语义,只是缓存串:
   不加它,Pages 的 CDN 与浏览器会继续发旧图,现象是"改了掩膜但肖像没变"。
   当前四个 `v` 依次是 7 / 3 / 3 / 3(在仓库根复核:`grep -n "v: [0-9]" src/main.js`)。
3. **不要手改像素**。它们是脚本产物:换 `../tools/<id>-photo.jpg` 或调 `CONFIGS` 参数再重跑。
   手工在图像编辑器里涂抹能应急,但下一次重跑就被覆盖。

## 和谁打交道

- **上游**:`../tools/*-photo.jpg` + `../tools/prepare-mask.mjs`。
- **下游**:`npm run build` 把它们原样拷进 `../dist/`,随 GitHub Pages 一起发布;
  运行时由 `src/core/mask.js` 通过 `<img>` 读取(需要浏览器把图解码到 canvas 里取像素)。
- **改了这里之后要跑**:改 `../src/main.js` 的 `v` → `npm run build` → `npm run preview`,
  在四个方向各看一眼轮廓对不对(没有自动化测试)。

## 别动

- 不要往本目录随手放文件:这里的**任何东西都会被公开发布**,包括这份 `README.md`
  —— 它会出现在 `https://<站点>/README.md`。放隐私内容或大文件前先想清楚。
- 不要把掩膜改名成 `mask-marx.png` 之类:URL 是按 `<id>-mask.png` 拼出来的,不读目录清单。
- 不要删掉某张图指望"少一位思想家":四向 90° 的结构写死在着色器里,缺图等于整页加载失败,
  见 [`../AGENTS.md`](../AGENTS.md) 的「关键约定 4」。
