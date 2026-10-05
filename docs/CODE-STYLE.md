# 思想云 · Marx Cloud 代码风格

> 用途：给改本仓代码的人与 AI。约定来自既有实践；无 lint/TypeScript/格式化工具（有意），
> 门禁是 `node --check` + 数据契约 + 构建 + 浏览器实测。

## 代码风格

- 原生 ES Module + three.js，不引入框架、不引 TypeScript、不加格式化配置（有意保持零工程化）。
- 分层固定：`main.js` 装配（唯一入口，不导出）、`core/` 渲染与拾取、`ui/` 界面、`data/` 数据。
  新代码先想清楚放哪层，不许 ui 反向 import core。

## 命名与结构约定

- 离线脚本 `tools/*.mjs` 一脚本一件事；共用图像管线原语放 `tools/lib/`（两脚本约 200 行重复
  已于 2026-10-05 抽库归一，新增重复先抽库）。
- 语录批次 `tools/gen/quotes-<组名>-<人物id>-<序号>.ndjson`；批次合并后仍留仓供追溯。
- 中文正文（源码注释、`index.html`、文档）一律半角逗号，全仓禁全角逗号 U+FF0C
  （核对命令见 `docs/ARCHITECTURE.md` 关键约定 11）。

## 错误处理与已知陷阱

- `cloud.js` 的 GLSL `groupPos()` 与 `scene.js` 的 JS 版是同一公式的两份实现，逐项一致
  （含种子系数）；改一侧必须同步另一侧，否则点击拾取静默失灵。
- DOM 是契约：`index.html` 的 18 个 `id` 中 14 个被 `getElementById` 引用，改名即 `null` 报错。
- `pickStar()` 是 O(粒子数) CPU 遍历（悬停限流 40 ms、隔点采样）——不要改成密集拾取。
- 嵌入式 webview 的 0×0 视口自愈逻辑（逐帧比对 + 300 ms 兜底）不是冗余代码，删掉画面会冻住。
