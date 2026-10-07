# 思想云 · Marx Cloud Git 规范

> 用途：给提交本仓代码的人。分支、发布链路、入库边界与跨仓义务都在这里。

## 分支与提交策略

- 单 `main` 分支，推 `main` 触发 Pages 发布（`deploy.yml`：`npm ci` → `verify` → `build` →
  deploy-pages；CI 用 node 20，本机 24 实测兼容）。
- **一批一提交**：数据（quotes/figures）与由它重算的生成物（掩膜/徽章/横幅）必须同批提交；
  生成物单独变化而无源变化 = 反了。
- 提交前门禁:[TESTING.md](TESTING.md) 四条命令 + `check_docs`。

## 必须入库 / 禁止上传

| 判定 | 规则 |
|---|---|
| 必须入库 | `src/`、`tools/`（含 `tools/gen/` 批次文件与照片素材）、`public/`（掩膜与头像是**入库的产物**，字节稳定）、`docs/`、全部文档与构建配置 |
| 禁止上传 | `dist/`（本地产物，交付走 Pages）、`node_modules/`、`tools/preview-*.png`、`.vercel`、`.env*`、`*.log`（`.gitignore` 已挡） |

## CI 与发布

- `.github/workflows/deploy.yml` 推 `main` 或手动触发；徽章/Actions 接口对公开仓免认证，
  URL 用仓库名 `marx-cloud` 不是目录名 `Marx_Cloud`。
- **跨仓义务**：`dist/` 产物被 `luzzz.me` 的 `/marx-cloud/` 子页面拷贝收录——本仓改动合入
  后，需到 luzzz.me 重跑 `pnpm sync:showcases && pnpm build` 并核对子页面（跨仓冻结路径）。
- tag：未打 tag（无版本发布流程，`package.json` 版本 `1.0.0` 未随发版推进）。

## commit message

- 风格沿用既有历史：`<type>(<scope>): 中文一句话` 或 `<type>: 中文一句话`，
  type 取 `feat / fix / docs / chore / refactor`（复核：`git log --oneline -10`）。
