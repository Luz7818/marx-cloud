# 思想云 · Marx Cloud 测试规范

> 用途：给改完代码要验证的人。本仓没有测试框架（有意，见 `docs/ARCHITECTURE.md`），
> 但有零依赖的图像管线行为回归；门禁是语法检查 + 数据契约 + 图像回归 + 构建 + 浏览器实测。

## 测试分层

| 层 | 管什么 | 怎么做 |
|---|---|---|
| 语法检查 | 全部源码可解析 | `node --check` 逐文件，无输出即过 |
| 数据契约 | 语录↔人物、分组、DOM id、无全角逗号、无重复 | `npm run verify`（`tools/verify-data.mjs`，零依赖） |
| 图像管线回归 | 面部影调、细节、高光、边界与确定性 | `node tools/test-image-pipeline.mjs`（零依赖测试文件,使用 Node 内置断言） |
| 构建 | 产物可生成、体积口径 | `npm run build`，退出码 0 且无 `chunk size` 警告 |
| 浏览器实测 | 交互与三种姿态 | `npm run preview` 开 `http://localhost:4173/`，四个方向各点一遍星 |

## 运行命令

```bash
npm run verify
node tools/test-image-pipeline.mjs
for f in $(git ls-files 'src/*.js' 'tools/*.mjs' vite.config.js); do node --check "$f" || echo "FAIL $f"; done
npm run build
```

`npm run build` 约 1 秒；`dev` 起在 5173、`preview` 起在 4173。

## 用例编写规范

本仓不引入测试框架（有意）。数据扩充走 `tools/selfcheck.mjs` 批校验
（批次语料在 `data/quotes-src/`,跑 `node tools/selfcheck.mjs --all`）,新增数据必须先过它再合并；图像算法走
`node tools/test-image-pipeline.mjs` 的 Node 内置断言回归。两者都是直接执行的零依赖测试文件,
不要为"工程化"引入测试框架/lint/TypeScript。

## 肖像管线的确定性与视觉验收

改动 `tools/lib/image-pipeline.mjs`、`prepare-mask.mjs` 或 `make-portraits.mjs` 后,先跑图像管线回归,
再完整运行两套生成器。`make-portraits.mjs` 必须不带 `--only`,确保 83 项运行时清单完整。保存首轮
4 张固定掩膜、79 张按需掩膜和 `src/data/portraits.js` 的 SHA-256,立即以同样命令完整生成第二轮
并再次计算；两轮摘要必须逐项相同。算法有意变化时生成物相对 Git 出现差异是预期结果,确定性判据
是第二轮与第一轮相同,不是要求生成物恢复为 Git-clean。

随后用 `npm run preview` 做浏览器验收:四个固定方向逐一确认眼鼻、嘴部和须发可辨且高光不过曝;
再点亮明暗、纹理不同的按需肖像,确认最近槽换装、五官层次和切换行为;抽查无掩膜人物仍显示
徽记回退。自动回归通过不能替代这一步视觉验收。

## 改动后的验证

| 动了什么 | 必须跑 | 通过判据 |
|---|---|---|
| 任意 `.js` | `node --check` 全量循环 | 无输出 |
| 任意代码 | `npm run build` | 退出码 0，无 chunk 警告 |
| `src/data/quotes.js`、`figures.js` | `npm run verify` + 「数据规模」复核命令 | verify 退出码 0；句数与预期一致 |
| `data/quotes-src/` 批次文件 | `node tools/selfcheck.mjs --all` → `node tools/merge.mjs` → `npm run verify` | selfcheck 问题 0 个 |
| 图像管线或大型肖像掩膜 | 图像回归 → 两次完整生成并比 SHA-256 → build → preview | 回归通过；两轮逐字节一致；固定与按需肖像通过视觉验收 |
| `tools/emblem-ref.png` 或 make-emblem | `node tools/make-emblem.mjs` | 点位仍 3400，徽章能认出镰刀锤头 |
| `cloud.js` / `scene.js` 位置公式 | `npm run dev` 逐姿态点星 | 成形/散开/徽章都能点中，气泡与卡片同人同句 |
| `index.html` 的 DOM | `npm run dev` 开控制台 | 无 `null` 报错；16 个被引用 id 都在 |
| 提交前 | `(cd .. && python 文档标准/check_docs.py Marx_Cloud)` | 退出码 0,无阻断项 |
