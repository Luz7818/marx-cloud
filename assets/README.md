# assets/ —— 入库素材

> 用途:说明离线生成脚本的原始输入素材放在哪、谁写入它们、为什么入库。

本目录存放生成脚本的原料,目前只有 `portrait-src/` 人物原图缓存:`tools/fetch-portraits.mjs`
按 `src/data/figures.js` 的 WIKI 字段从 Wikimedia 抓取后写进来,`tools/make-portraits.mjs`
读它加工成 `public/avatars/`、`public/portraits/` 与 `src/data/portraits.js`。素材不进构建
(`npm run build` 不读这里),但删掉它们,头像与换装掩膜就无法重算。

## 文件清单

本目录一级只有这份板块说明;实际文件都在 `portrait-src/` 子目录:

| 文件 | 干什么 | 备注 |
|---|---|---|
| `portrait-src/<id>.jpg` / `.png` | 83 张人物原图(Wikidata P18 → Commons 缩略图,宽 640) | `fetch-portraits.mjs` 产物,按 `figures[].id` 命名;幂等,已存在的 id 跳过(`--force` 重抓) |
| `portrait-src/credits.json` | 每张原图的来源页面与许可记录 | `fetch-portraits.mjs` 产物;对外署名页在 `public/portraits/CREDITS.md` |

## 子目录

| 子目录 | 负责 |
|---|---|
| `portrait-src/` | 人物原图素材缓存:83 张按人物 id 命名的原图 + credits.json 署名记录 |

## 和谁打交道

- **上游**:`tools/fetch-portraits.mjs`(联网抓取写入;数据源 Wikidata P18 与 Commons)。
- **下游**:`tools/make-portraits.mjs`(读原图生成侧栏头像、按需换装掩膜与运行时清单)。
- **改这里之后要跑**:`node tools/make-portraits.mjs`(完整跑,重出头像/掩膜/清单)→
  `npm run verify` → `npm run build`。

## 别动

- 不要手工修图或替换原图:它们是脚本按 id 抓取的,手工改动会在下次 `--force` 重抓时被覆盖;
  要换某人的图,先改 `src/data/figures.js` 的 WIKI 字段再重抓。
- 不要删原图或 credits.json 给仓库瘦身:删掉后头像与掩膜无法重算,而它们不进构建产物,
  瘦身省不了用户下载的任何字节。
