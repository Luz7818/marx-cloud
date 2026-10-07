# data/ —— 语录批次语料

> 用途:说明语录扩充流水线的批次 ndjson 放在哪、如何校验与合并、为什么合并后仍留仓。

`quotes-src/` 下的 `quotes-*.ndjson` 是语录扩充流水线的批次语料:人工整编,经
`tools/selfcheck.mjs` 校验、`tools/merge.mjs` 以行内容判重后幂等追加进 `src/data/quotes.js`
末尾。合并完成后批次文件仍留仓供追溯;运行时只读 `src/data/quotes.js`,`npm run build`
不经过本目录。

## 文件清单

本目录一级只有这份板块说明;实际文件都在 `quotes-src/` 子目录:

| 文件 | 干什么 | 备注 |
|---|---|---|
| `quotes-src/quotes-<组名>-<人物id>-<序号>.ndjson` | 75 个语录批次,每行一条 JSON(`f` 人物 id / `w` 著作 / `y` 年份 / `t` 原文) | `tools/selfcheck.mjs` 校验、`tools/merge.mjs` 合并;已合并批次留仓,勿再改动 |

## 子目录

| 子目录 | 负责 |
|---|---|
| `quotes-src/` | 语录批次语料:按组名与人物 id 分文件的 ndjson,合并进 quotes.js 后留仓追溯 |

## 和谁打交道

- **上游**:人工整编的新批次文件(命名遵循 `quotes-<组名>-<人物id>-<序号>.ndjson`,
  t 必须是真实可查的经典原文)。
- **下游**:`tools/selfcheck.mjs`(校验)→ `tools/merge.mjs`(追加写 `../src/data/quotes.js`)→
  `tools/coverage.mjs`(每人物条数分布)。
- **改这里之后要跑**:`node tools/selfcheck.mjs --all`(问题 0 个)→ `node tools/merge.mjs --dry`
  预览 → 正式合并 → `npm run verify` + `npm run build`。

## 别动

- 不要改已合并进 quotes.js 的批次文件:merge 以「行内容」判重,改动会被当新语录重复追加,
  破坏「语录下标即对外编号」契约;纠错直接改 `src/data/quotes.js` 并评估编号影响。
- 不要把批次文件改名成其他扩展名或挪出 `quotes-src/`:三个脚本都按
  `data/quotes-src/*.ndjson` 扫描,挪走后 selfcheck 报「找不到批次文件」、merge 追加 0 条。
- 新批次先过 `node tools/selfcheck.mjs <批次名>`(问题 0 个)再合并;t 含全角逗号或
  半角双引号会被判不合格。
