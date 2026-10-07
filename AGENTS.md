# AGENTS.md —— 项目协作与代码开发规范（唯一权威入口）

> 用途:给 AI 编码助手与所有开发者。这里是规范入口与索引:目标、原则、流程、模块规则、
> 维护矩阵、阅读清单都在这份文件里。细则一律链接到对应文件,冲突时以细则文件为准并回改本文件。
> `README.md` 与 `docs/GET-START.md` 引用的规模数字以本文件的「当前状态」为准,它们只链接不复述。

## 项目目标

- 定位:Vite 5 + 原生 ES Module + three.js 的单页 WebGL 作品:5897 句语录渲染成星尘,相机每转过
  90° 聚合成一位思想家的肖像(91 位人物,点亮可换装)。构建产物是纯静态文件,没有后端、没有
  运行时服务、没有数据库。
- 核心功能:星图漫游与拾星读句、四向肖像聚合、徽章视图、拾遗收藏、留影导出、语录扩充流水线。
- 技术栈:Vite 5 + three.js 0.169(唯一 runtime 依赖),CI 用 node 20(复核:`npm ls --depth=0`)。
- 详情:[README.md](README.md)、[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

## 开发原则

1. 正确性优先。
2. 可维护性优先。
3. 代码简洁、项目简洁。
4. 小步迭代。
5. 单模块开发。
6. 每个改动必须有明确设计与验收标准。
7. 禁止一次生成整个项目。
8. 禁止跳步开发。

执行口径:先想后写(假设与歧义先挑明);最简优先(不加没要求的功能与抽象——本仓刻意不引入
测试框架/lint/TypeScript);外科手术式改动(不动无关代码,每行改动可追溯到需求);目标驱动
(先有可验证判据再动手,宣称完成前先跑通 [docs/TESTING.md](docs/TESTING.md) 的门禁)。

## 开发流程

**分析 → 设计 → 实现 → 测试 → 文档更新 → Git提交 → 等待确认**。不得跳过任何阶段。

| 阶段 | 产出物 | 放行标准 |
|---|---|---|
| 分析 | 影响面清单(动哪一层:core/ui/data/tools,是否触及生成物) | 影响面说全 |
| 设计 | 方案说明(公式/数据格式变化、回退方式) | 验收标准已定义;与更简方案比较过 |
| 实现 | 代码 | 只含设计内改动,符合 [docs/CODE-STYLE.md](docs/CODE-STYLE.md) |
| 测试 | 门禁结果 | [docs/TESTING.md](docs/TESTING.md) 四条命令 + 浏览器实测 |
| 文档更新 | 受影响文档 diff | 维护矩阵逐项过完 |
| Git提交 | 提交 | 符合 [docs/GIT.md](docs/GIT.md),一批一提交(生成物与源同批) |
| 等待确认 | —— | 等人确认后推送;推送后 luzzz.me 侧需重跑同步 |

## 模块开发规则

- 一个智能体一次只开发一个模块;模块完成后才能进入下一模块。
- 如需同时开发,使用多个子智能体,每个子智能体同样一次只开发一个模块。

模块完成标准(全部满足才算完成):

1. 功能完成:达到 [TODO.md](TODO.md) 中该任务的验收标准。
2. 测试通过:符合 [docs/TESTING.md](docs/TESTING.md)。
3. 最简原则:代码和项目架构都保持最简洁,无冗余抽象与重复实现。
4. [TODO.md](TODO.md) 更新:勾选完成项、明确下一项。
5. [HISTORY.md](HISTORY.md) 追加变更记录。
6. 受影响的 docs 更新(按需)。
7. [README.md](README.md) 更新(如有面向访客的变化)。
8. Commit message 符合 [docs/GIT.md](docs/GIT.md)。

## 文档维护规则

| 事件 | 需更新 |
|---|---|
| 模块完成 | `TODO.md`、`HISTORY.md`、受影响 docs |
| 架构决策(公式、数据格式、生成物约定、发布链路变化) | `docs/ARCHITECTURE.md` + `HISTORY.md` 记录缘由 |
| 命令/入口/交互变化 | `README.md` / `docs/GET-START.md` / 对应子目录 README |
| 增删一级或二级目录 | 仓根 `目录说明.md` + 本文件 |
| 规模数字(句数/人物数/体积)变化 | 本文件「当前状态」 |
| 新对话/新任务开始 | 按下方阅读清单阅读 |

## 开发前阅读清单

每个新对话/新任务,按顺序阅读:

1. 本文件(`AGENTS.md`)
2. [TODO.md](TODO.md)
3. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)(30 行职责表、11 条关键约定、数据流水线在这里)
4. [docs/GET-START.md](docs/GET-START.md)
5. [HISTORY.md](HISTORY.md)
6. 与任务相关的 [docs/CODE-STYLE.md](docs/CODE-STYLE.md)、[docs/TESTING.md](docs/TESTING.md)、[docs/GIT.md](docs/GIT.md)

阅读完成后**不要写代码**:先做架构评审,输出——项目理解 / 核心模块 / 模块依赖关系 / 潜在风险 /
建议优化项 / 推荐开发顺序 / 是否发现架构问题——然后等待确认。

- 工作区级纪律不在本清单里：新增/摆放文件与目录先读 `../文档标准/项目整体规范.md` §2.3（最小根判断顺序）；跨仓耦合与 Git 纪律见其 §八。
## Git 索引

- Git 规范:[docs/GIT.md](docs/GIT.md)(dist 不入库、luzzz.me 跨仓同步义务、一批一提交)

## 当前状态

| 项 | 值 | 复核命令 |
|---|---|---|
| 构建 | 通过,`18 modules transformed`(这个数字跟源码模块数绑定,加一个 `.js` 就会变),约 1 秒 | `npm run build` |
| 产物 JS | 磁盘文件 1,511,654 字节 / gzip 实测约 466 kB;`npm run build` 打印的 `1,020.46 kB` 是**字符数口径**(UTF-16 单元,中文语录按 1 计),落盘成 UTF-8 后中文按 3 字节展开,所以对账磁盘必须用 `wc -c`,别拿打印值对 | `wc -c dist/assets/*.js`;`gzip -c dist/assets/*.js \| wc -c` |
| 产物 CSS | 16.39 kB / gzip 3.95 kB | `npm run build` 末三行 |
| 产物 HTML | 2.17 kB / gzip 1.39 kB | `npm run build` 末三行 |
| dist 全量 | 约 10.31 MiB = `assets/` 1,528,049(JS 磁盘 1512k + CSS 16k)+ `index.html` 2,660 + 4 张固定肖像掩膜 1,056,817 + `portraits/` 换装掩膜 7,828,671(79 张,按需加载)+ `avatars/` 372,134 + `README.md` 与 `CREDITS.md`(随文档改动而变,不写死总数) | `du -sb dist \| cut -f1`;分项 `du -sb dist/*` |
| 语法检查 | 26 个源码文件(`src` 14 + `tools` 11 含测试与 lib 子目录 + `vite.config.js`)全部通过 | `files="$(find src tools -type f \( -name '*.js' -o -name '*.mjs' \) -print) vite.config.js";printf '%s\n' $files \| wc -l;for f in $files;do node --check "$f" \|\| echo "FAIL $f";done` |
| 数据契约校验 | `npm run verify`(`tools/verify-data.mjs`,零依赖):语录↔人物 id、每人物至少 1 条、分组 key、DOM id、无全角逗号、无重复(f+t)、肖像清单文件存在 | 退出码 0,结尾打印「数据契约校验通过:91 位人物 / N 条语录 / 4 个分组 / 肖像平面 4 块」 |
| lint / 类型检查 / 格式化 | 无配置也无依赖 | `git ls-files` 里没有 `eslint*`、`tsconfig*`、`prettier*` |
| 运行时依赖 | 只有 `three@0.169.0` | `npm ls --depth=0` |
| 安装期包数 | 61 个(lock 展开,含 devDependencies) | `node -e "console.log(Object.keys(require('./package-lock.json').packages).length-1)"` |
| 数据规模 | 5897 句语录 / 91 位人物 / 4 个分组 / 3400 个徽章点位 | `node --input-type=module -e "const q=(await import('./src/data/quotes.js')).quotes,{figures:f,groups:g}=(await import('./src/data/figures.js')),e=(await import('./src/data/emblem.js')).emblemPoints;console.log(q.length,f.length,g.length,e.length)"` |
| 代码规模 | `src/` 下 14 个 `.js` 共 9039 行,另有 `style.css` | `git ls-files 'src/*.js' \| wc -l`;`cat $(git ls-files 'src/*.js') \| wc -l` |
| 粒子数分档 | 桌面 28000 / 触屏或窄屏 20000 / 软件渲染 14000 / 带 `?lite` 9000 | `grep -n "const COUNT" src/main.js` |
| 自动巡游节拍 | 停留 9 秒 + 转场 8 秒,空闲 4 秒后恢复 | `grep -n "DWELL = 9" src/core/scene.js` |
| CI | 工作流只在 push `main` 或手动触发时跑。**这里不写"最近一次是哪个提交"**——分支每推一次它就变,写进文档同一次提交里就作废了。当前分支 HEAD 的徽章为 `passing`(复核见右)。不装 `gh` 也能读:徽章与 Actions 接口对**公开仓都免认证**,但 URL 里要用**仓库名 `marx-cloud`**,不是目录名 `Marx_Cloud`(用后者返回 404)。要提交号与耗时再用 `/actions/runs`(匿名限 60 次/小时/IP,别拿它轮询) | `python -c "import urllib.request as u;b=u.urlopen(u.Request('https://github.com/Luz7818/marx-cloud/workflows/Deploy%20to%20GitHub%20Pages/badge.svg',headers={'User-Agent':'Mozilla/5.0'}),timeout=30).read().decode();print('passing' in b)"` 应为 `True` |
| 线上版本 | HTTP 200,资源 hash 与本机 `npm run build` 一致 | `curl -s https://luz7818.github.io/marx-cloud/ \| grep -o 'assets/[a-zA-Z0-9._-]*' \| sort -u` |
| 本机环境 | node v24.19.0 / npm 11.17.0;CI 用 node 20 | `node --version && npm --version` |
| `dist/` | gitignore 的本地产物,不是交付物,不要提交 | `git check-ignore -v dist/index.html` |

## 已知坑(省下一次的调查时间)

- 粒子与语录的配对每次加载用 `Math.random()` 现算,"某颗星固定某句"不成立;要稳定需播种
  `quoteIdxByParticle` 的生成方式,目前无机制保证(评估项见 `TODO.md` 任务 2)。
- `pickStar()` 是 O(粒子数) 的 CPU 遍历;悬停以 `step = 2` 隔点采样并限流 40 ms。别改成
  `step = 1` 的密集拾取,高 DPI 屏会掉帧。
- 没有 WebGL 就没有降级路径:`new THREE.WebGLRenderer()` 直接抛,`detectSoftwareGL()` 只降
  粒子数不解决"完全没有 GL"。
- 复制/分享依赖 Clipboard API,只在安全上下文存在;局域网 IP 打开时按钮点了没反应(报错只在
  控制台)。
- 嵌入式 webview 冷启动视口可能 0×0,靠逐帧 clientWidth 比对与 300 ms 兜底驱动自愈——
  删掉这两处会让后台标签页/自动化截图里的画面冻住。
- 帧率自适应只在 `auto` 档生效且**只降不升**(阈值 22 fps,阶梯 `[1, 0.65, 0.45, 0.3, 0.2]`)。
- `uSize` 桌面 0.195、移动端与软件渲染 0.26、"低"画质档再乘 1.35,三处叠乘——调默认值前先
  确认设备走哪条分支。
- 单 chunk 打包是刻意的,`chunkSizeWarningLimit: 900` 别顺手"修"掉。
- `tools/prepare-mask.mjs` 注释说 p4..p96,实现取 **p10..p90**——照注释调自动曝光会调偏。
- npm 11 打 `allow-scripts` 警告(esbuild postinstall),构建实测正常,不要为此改依赖。
- 不要为"补齐工程化"引入测试框架、lint、TypeScript 或打包优化插件;不要另写一套规模数字
  (以本文件「当前状态」为准);没有换素材不要重跑 make-emblem/make-banner(未播种随机,
  会产出无意义的字节 diff);不要把 `public/` 当纯静态目录(Vite 整目录拷进 `dist/` 公开);
  不要动 `PORTRAIT_PLANES` 数组长度、不要重排 `figures`;不要提交 `dist/`。
