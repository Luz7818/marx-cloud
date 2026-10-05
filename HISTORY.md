# HISTORY —— 版本更新记录

> 用途：记录每次版本与规范变更的内容和缘由。只追加，禁止删除或改写既有条目；写错了就追加一条
> 更正。新条目写在文件末尾。本仓无独立版本发布流程（`package.json` 恒 1.0.0），版本演进以
> 提交记录为准，本文件记规范与结构级变更。

## 2026-10-05 · 文档规范体系落位

- 文档从"五件套"迁到九件体系：新增 `docs/ARCHITECTURE.md`、`docs/CODE-STYLE.md`、
  `docs/TESTING.md`、`docs/GIT.md`、`HISTORY.md`、`TODO.md`；`docs/getting-started.md`
  更名 `docs/GET-START.md`；`AGENTS.md` 重写为规范入口（原「仓库地图」30 行职责表、11 条
  关键约定与「数据扩充流水线」整体移入 ARCHITECTURE，原「改动后的验证」移入 TESTING，
  「当前真实状态」更名「当前状态」保留全部数字与复核命令）。
- 变更缘由：落位《项目整体规范.md》九件必建。本仓此前无版本记录文件，更早历史未在此建档，
  可由 `git log --oneline` 追溯。
