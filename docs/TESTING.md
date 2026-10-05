# 思想云 · Marx Cloud 测试规范

> 用途：给改完代码要验证的人。本仓没有测试框架（有意，见 `docs/ARCHITECTURE.md`），
> 门禁是语法检查 + 数据契约 + 构建 + 浏览器实测。

## 测试分层

| 层 | 管什么 | 怎么做 |
|---|---|---|
| 语法检查 | 全部源码可解析 | `node --check` 逐文件，无输出即过 |
| 数据契约 | 语录↔人物、分组、DOM id、无全角逗号、无重复 | `npm run verify`（`tools/verify-data.mjs`，零依赖） |
| 构建 | 产物可生成、体积口径 | `npm run build`，退出码 0 且无 `chunk size` 警告 |
| 浏览器实测 | 交互与三种姿态 | `npm run preview` 开 `http://localhost:4173/`，四个方向各点一遍星 |

## 运行命令

```bash
npm run verify
for f in $(git ls-files 'src/*.js' 'tools/*.mjs' vite.config.js); do node --check "$f" || echo "FAIL $f"; done
npm run build
```

`npm run build` 约 1 秒；`dev` 起在 5173、`preview` 起在 4173。

## 用例编写规范

本仓不引入测试框架（有意）。数据扩充走 `tools/gen/` 流水线自带的批校验
（`node tools/gen/selfcheck.mjs --all`），新增数据必须先过它再合并；不要为"工程化"引入
测试/lint/TypeScript。

## 改动后的验证

| 动了什么 | 必须跑 | 通过判据 |
|---|---|---|
| 任意 `.js` | `node --check` 全量循环 | 无输出 |
| 任意代码 | `npm run build` | 退出码 0，无 chunk 警告 |
| `src/data/quotes.js`、`figures.js` | `npm run verify` + 「数据规模」复核命令 | verify 退出码 0；句数与预期一致 |
| `tools/gen/` 批次文件 | `selfcheck.mjs --all` → `merge.mjs` → `verify` | selfcheck 问题 0 个 |
| `public/*-mask.png` | 同时改 `src/main.js` 的 `v` → build → preview | 肖像轮廓对得上照片，转 90° 换人 |
| `tools/emblem-ref.png` 或 make-emblem | `node tools/make-emblem.mjs` | 点位仍 3400，徽章能认出镰刀锤头 |
| `cloud.js` / `scene.js` 位置公式 | `npm run dev` 逐姿态点星 | 成形/散开/徽章都能点中，气泡与卡片同人同句 |
| `index.html` 的 DOM | `npm run dev` 开控制台 | 无 `null` 报错；14 个被引用 id 都在 |
| 提交前 | `cd ../文档标准 && python check_docs.py Marx_Cloud` | 退出码 0，无阻断项 |
