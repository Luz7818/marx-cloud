<div align="center">

<img src="docs/banner.svg" alt="思想云 · Marx Cloud" width="100%">

# 思想云 · Marx Cloud

**一张可漫游的马克思主义经典星图**

万点星辰,随视角流转,汇成思想的肖像 —— 每颗星,都是一句经典。

[![在线演示](https://img.shields.io/badge/%F0%9F%8C%90%20%E5%9C%A8%E7%BA%BF%E6%BC%94%E7%A4%BA-GitHub%20Pages-8a2be2?style=flat-square)](https://luz7818.github.io/marx-cloud/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

> 用途:第一次打开这个仓库的人。看完知道它是什么、怎么跑起来、怎么玩、哪里不行。

1041 句经典著作里的原文,每一句是天上的一颗星。拖着星云绕着竖轴转,每转过 90°
这些星就聚拢成一位思想家的肖像 —— 马克思、恩格斯、列宁、卢森堡,轮廓与明暗直接从
本人照片还原,不是描出来的剪影。再转 90° 又散作星雾,肖像只在你的视角正对时存在。

**规模**:1041 句语录 · 35 位思想家 · 4 组徽章 · 桌面端 28000 颗粒子
（复核:`AGENTS.md` 的「当前真实状态」表,里面有可直接粘贴的统计命令）
**体积**:`npm run build` 产出一个 628.35 kB / gzip 211.50 kB 的 JS;`dist/` 全量约 1.65 MB
(复核:`npm run build` 末三行,以及 `du -sb dist | cut -f1`)。

## 30 秒跑通

```bash
git clone https://github.com/Luz7818/marx-cloud.git
cd marx-cloud
npm install
npm run dev
```

看到 `VITE v5.4.21  ready in 319 ms`(毫秒数随机器变)与 `➜  Local:   http://localhost:5173/`
就说明起来了,浏览器打开它即可(需要 WebGL)。国内网络装依赖慢时改用
`npm install --registry=https://registry.npmmirror.com`。
完整步骤、故障表与改内容的做法见 [上手手册](docs/getting-started.md)。

## 怎么玩

| 输入 | 效果 |
| :--- | :--- |
| 拖拽(或单指滑动) | 绕竖轴转视角,每转过 90° 聚合出下一位思想家,底部字幕跟着换人 |
| 滚轮 / 双指捏合 | 推近拉远,可以转到平面内部 |
| `A` / `D` | 左右转向;`W` / `S` 升降俯仰;`Q` / `E` 拉近推远;按住 `Shift` 加速约 2.2 倍 |
| `P` | 暂停 / 恢复自动巡游(相机停在原地,不再自己换人像) |
| 悬停一颗星 | 气泡给出思想家与该句前 30 字(触屏设备没有悬停) |
| 点一颗星 | 展开语录卡:原文、著作、年份、编号,可复制 / 分享 / 收进拾遗 / 留影 / 同人物下一条 |
| 点虚空 | 随机捞起一句(顶栏「拾句」可关;点亮某人后只捞他/她的) |
| 左栏点人名 | 只留下这个人的星,其余完全隐去;肖像视图下只有那四位会同时被飞抵,徽章视图按所属分组飞过去 |
| 左栏 `▸` | 展开该思想家的全部语录清单,点一句直接定位 |
| 顶栏「视图·肖像 / 徽章」 | 在四向肖像与党徽(镰刀锤头)两种星图之间切换 |
| `H` / `F` / `Esc` | 隐藏全部界面(截图用) / 全屏 / 关掉语录卡 |
| 网址 `#q=N` | 直达第 N+1 句(下标从 0 起),例:`/marx-cloud/#q=118` 是《实践论》那句"梨子的滋味" |
| 网址 `?lite` | 9000 粒子并锁在低画质档,用于弱机器 |

自动巡游在进入星图后开始:每个像位停留 9 秒,再用 8 秒转到下一位,顶栏「速度」滑杆
把它乘上 0.4–2.4 倍;任何拖拽或按键都会立即接管,停手 4 秒后恢复。

## 目录怎么分

| 目录 | 负责 |
| :--- | :--- |
| [`src/`](src/README.md) | 全部前端代码:`core/` 渲染与拾取、`ui/` 界面、`data/` 语料与点位 |
| [`public/`](public/README.md) | 4 张肖像亮度掩膜,运行时按 URL 拉取,会被原样拷进产物 |
| [`tools/`](tools/README.md) | 离线生成脚本(掩膜、徽章点位、README 横幅)与照片素材 |
| `docs/` | 上手手册与 README 横幅 |
| `.github/workflows/` | 推 `main` 后构建 `dist/` 并发布到 GitHub Pages |

## 改内容

内容集中在两个手工文件,改完刷新即生效,粒子分配与侧栏数字自动跟上:

- [`src/data/quotes.js`](src/data/quotes.js) —— 语录数组 `{ f: 人物 id, w: 著作, y: 年份, t: 原文 }`
- [`src/data/figures.js`](src/data/figures.js) —— 人物元数据与搜索别名

肖像与徽章的图形由 `tools/` 下的脚本从照片和党徽标准图形重算,步骤与运行风险
(哪些命令会覆盖已入库的文件)写在 [上手手册第 5 节](docs/getting-started.md)。

## 已知做不到什么

1. **必须有 WebGL**。没有 GPU 上下文时 `THREE.WebGLRenderer` 直接抛错,页面停在
   "加载失败:……",没有图片或 CSS 兜底版本。软件渲染只是自动降到 14000 粒子,不会变流畅。
2. **触屏只做 basics**。单指转向、双指缩放、点击拾星可用;悬停气泡用不上,窄屏下面板
   变成底部抽屉且默认收起,`#hint` 直接隐藏。手机浏览器的实际帧率与「留影」下载行为未测过。
3. **没有任何自动化测试**。没有测试、没有 lint、没有类型检查;`package.json` 的 scripts
   只有 `dev` / `build` / `preview`。改动只能靠 `node --check` 与浏览器实测把关。
4. **同一颗星每次刷新对应的句子可能不同**。粒子与语录在加载时随机配对,
   所以"这颗星永远是这句"不成立;稳定的编号只属于 `#q=N` 与侧栏目录。
5. **分享与复制依赖 Clipboard API**,只在 https 或 localhost 下可用;
   用局域网 IP 打开时这两个按钮点了没反应(不报错到界面上)。
6. **收藏存在本机 localStorage**(键 `marxcloud.favs.v1`),不跨设备;
   语录数组中间插入或删条目会让已分享的 `#q=N` 与收藏整体错位,所以只在末尾追加。
7. **肖像固定四位**。四向 90° 写死在着色器与相机权重里,加第五位不是改配置能做到的。

## 改完跑什么

这个仓库没有自动化测试,门禁就是这两条加一次浏览器实测:

```bash
for f in $(git ls-files 'src/*.js' 'tools/*.mjs' vite.config.js); do node --check "$f" || echo "FAIL $f"; done
npm run build
```

第一条在 16 个源码文件上逐个查语法,无输出即通过;第二条要求退出码 0 且不打 `chunk size` 警告。
之后 `npm run preview` 打开 `http://localhost:4173/`,把改动在四个方向各点一遍星。
哪些文件是生成物、哪些命令会覆盖已入库文件,写在 [AGENTS.md](AGENTS.md)。

## 环境要求

Node 与 npm(本机 v24.19.0 / 11.17.0 实测,CI 用 node 20;复核:`node --version && npm --version`)、
一个支持 WebGL 的桌面浏览器。联网只为了 `npm install`,运行与构建都不需要网络,也没有密钥。

## 许可与致谢

代码以 [MIT](LICENSE) 许可发布。肖像照片来自 Wikimedia Commons 公有领域藏品,徽章底图
`tools/emblem-ref.png` 为 Commons 上 CC0 的党徽标准图形;语录仅供学习交流,版权归原作者与译者。
灵感致敬刘慈欣《诗云》。

---

准备改这个仓库的 AI 助手请先读 [AGENTS.md](AGENTS.md)。
