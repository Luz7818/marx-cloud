<div align="center">

<img src="docs/banner.svg" alt="思想云 · Marx Cloud" width="100%">

# 思想云 · Marx Cloud

**一张可漫游的马克思主义经典星图**

万点星辰,随视角流转,汇成思想的肖像 —— 每颗星,都是一句经典。

[![在线演示](https://img.shields.io/badge/%F0%9F%8C%90%20%E5%9C%A8%E7%BA%BF%E6%BC%94%E7%A4%BA-GitHub%20Pages-8a2be2?style=flat-square)](https://luz7818.github.io/marx-cloud/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r1xx-white?style=flat-square)](https://threejs.org/)
[![语录](https://img.shields.io/badge/%E7%BB%8F%E5%85%B8%E8%AF%AD%E5%BD%95-1041%20%E5%8F%A5-e5484d?style=flat-square)](src/data/quotes.js)
[![思想家](https://img.shields.io/badge/%E6%80%9D%E6%83%B3%E5%AE%B6-35%20%E4%BD%8D-ff8a5c?style=flat-square)](src/data/figures.js)

**[在线演示](https://luz7818.github.io/marx-cloud/)** · [特性](#-特性) · [玩法](#-玩法) · [本地运行](#-本地运行) · [技术架构](#-技术架构) · [编辑内容](#%EF%B8%8F-编辑内容)

</div>

---

> 💫 灵感致敬刘慈欣《诗云》与 [shiyun.cohenjikan.com](https://shiyun.cohenjikan.com):
> 神级文明把所有可能的诗都写成恒星,存进一片星云。
> 这里把两百年来写下的经典,存进万点星辰。

## ✨ 特性

- 🌌 **四向星云肖像** —— 星云绕轴流转,每转过 **90°** 便聚合成一位思想家的肖像:**马克思 → 恩格斯 → 列宁 → 卢森堡**;45° 过渡区散作漫天星雾,聚散只在视角之间。肖像掩膜由照片明暗直接还原,五官发须皆来自本人照片。
- 💬 **每颗星都是一句经典** —— 1041 句语录、35 位思想家,其中核心五人做深:**马克思 284、毛泽东 153、恩格斯 133、列宁 125、卢森堡 51**;《资本论》三卷、《德意志意识形态》、《关于费尔巴哈的提纲》、《哥达纲领批判》、《怎么办?》、《国家与革命》、《帝国主义论》、《反杜林论》、《自然辩证法》、《家庭、私有制和国家的起源》等专著逐条拆到星上。悬停预览、点击展开语录卡(原文 / 著作 / 年份 / 编号),可复制原文、分享链接、**收进拾遗**、**留影导出图片**;点击虚空,随机"拾起一句"(可关;点亮某人后只拾他/她的)。
- 🗂 **语录目录** —— 侧栏每位思想家可展开其全部语录清单,点任意一句即定位到那颗星。
- 🎯 **搜索支持字号与另译** —— 「润之」「守常」「乌里扬诺夫」「蔡特金」都能搜到;回车点亮并飞抵。
- 🎨 **思想家星群** —— 每位思想家一种专属色;侧栏一键点亮,只有他/她的星辰留下,其余完全隐去(不是压暗)。
- ☭ **徽章视图** —— 一键从肖像视图切到徽章视图:先驱 / 创始人 / 继承与发展 / 在中国 四组各自排成一枚**党徽(镰刀锤头)+ 五角星**,每转 90° 面对一组,其余组推到远处并压到几乎不可见。底图描自 `tools/emblem-ref.png`(Wikimedia Commons 上的党徽标准图形,CC0),由 `tools/make-emblem.mjs` 重采样为点位;约七成落在轮廓上 —— 粒子是加色发光的点,决定"认不认得出"的是描边而不是填充。
- 🚶 **自动巡游** —— 进入星图后相机自动巡游:每个像位停留片刻,再缓缓转过 90° 换下一位;拖拽随时接管,空闲后自动恢复;速度可调,`P` 可暂停。
- ⌨️ **键盘飞行** —— `WASD` 转向与进退,`Shift` 加速;`F` 全屏,`H` 隐藏全部界面只留星图。
- 🧷 **拾遗留在本机** —— 收藏写 localStorage,静态站没有账号体系,句子只留在你自己手里。
- 🎛️ **性能自持** —— 画质 自动/高/低 三档;软件渲染与低帧率环境自动降载,GPU 环境 28,000 粒子(再高就会因加色混合过曝而糊掉肖像)。
- ⚡ **零依赖前端** —— 仅 Three.js 一个运行时依赖,构建产物 gzip 约 212 kB(其中语录与点位数据约 80 kB),纯静态、任意托管即用。

## 🎮 玩法

| 操作 | 效果 |
| :--- | :--- |
| **拖拽 / `WASD`** | 旋转星云 —— 每转过 90° 聚合出下一位思想家,底部字幕随之更名;`Q`/`E` 进退,`Shift` 加速 |
| **滚轮 / 双指捏合** | 缩放,可穿入星云内部 |
| **悬停星尘** | 浮出气泡:思想家 + 语录预览(散开态、徽章态同样可用) |
| **点击星尘** | 展开该星语录卡:原文、著作、年份、编号,可复制 / 分享 / 拾遗 / 留影 / 同人物下一条 |
| **点击虚空** | 彩蛋:从虚空随机捞起一句经典(顶栏可关) |
| **左栏人物 / 搜索回车** | 点亮该思想家的星群,并飞抵其肖像或徽章方位 |
| **左栏 `▸` 目录** | 展开该思想家的全部语录,点一句即定位 |
| **拾遗区** | 回看本机收下的句子,点一句重新展开,可一键清空 |
| **留影** | 把这一句连同身后的星图导出成 1200×1500 竖版 PNG |
| **视图·肖像 / 徽章** | 切换四向肖像与镰刀锤头徽章两种星图 |
| **画质 / 速度** | 画质三档手动切换;自动巡游速度 ×0.4 – ×2.4 |
| **`H` / `F` / `P` / `Esc`** | 隐藏界面 / 全屏 / 暂停巡游 / 关闭语录卡 |
| **`#q=N`** | 直达第 N 句的分享链接(如 `/marx-cloud/#q=118`) |

## 🚀 本地运行

```bash
git clone https://github.com/Luz7818/marx-cloud.git
cd marx-cloud
npm install            # 国内网络:npm install --registry=https://registry.npmmirror.com
npm run dev            # http://localhost:5173
```

构建与部署:

```bash
npm run build          # 产物输出 dist/(纯静态)
npm run preview        # 本地预览构建产物
```

推送到 `main` 分支即自动部署到 GitHub Pages(见 [工作流](.github/workflows/deploy.yml)),无需任何手工步骤。

## 🏗️ 技术架构

```
tools/*-photo.jpg ──prepare-mask.mjs──▶ public/*-mask.png(亮度掩膜,越亮越密)
        自动背景分割(边界泛洪 + 面部椭圆先验)
        + 照片明暗自动曝光 + 高通细节
                                              │
                              mask.js CDF 逆变换采样 ×4 平面
                                              ▼
      cloud.js ShaderMaterial ◀── scene.js 相机方位角 → 四平面权重 uW0..uW3
      星云位 ↔ 四组肖像位 / 四组徽章位(uView 切换)   │
                                              ▼
                              main.js 装配 · 拾取 · 字幕 · 自适应
```

- **掩膜管线**:公有领域照片 → 边界泛洪切背景(面部椭圆内永不为背景,保护阴影面颊)→ 主体亮度 p4..p96 自动曝光 + 高通细节增强 → 按 `ped` 托底(剪影整体保持密度,明暗只做细节调制)→ 亮度掩膜;`--preview` 输出分割边界核对图。
- **四向变形**:四块互成 90° 的肖像平面各存一份粒子位置,顶点着色器按相机方位权重混合 —— 转肩即散、对位即聚,无任何骨架或 morph 动画;徽章视图下同一套权重驱动四枚徽章(本组粒子取 `aEmblem` 点位,其余组推到远处并压暗)。
- **全姿态拾取**:CPU 复算着色器位置后做屏幕空间最近邻,成形、散开与标志三种姿态都能点中星星本人;标志点位与肖像点位一样只算一次并永久缓存。
- **性能韧性**:软件渲染检测自动降粒子;<22fps 逐级下调绘制数(画质手动档可锁定);rAF 节流兜底驱动 + 交互即时出画(rAF 停摆的嵌入式 webview 里拖拽照样转);零视口自愈(嵌入式 webview 冷启动)。

## ✏️ 编辑内容

内容全部集中在两个文件,改完刷新即生效,界面与粒子分配自动更新:

- [`src/data/figures.js`](src/data/figures.js) — 人物元数据(姓名、生卒、地区、简介、专属色、分组),末尾 `ALIAS` 表挂字号/原名/另译,供搜索
- [`src/data/quotes.js`](src/data/quotes.js) — 语录数组 `{ f: 人物id, w: 著作, y: 年份, t: 原文 }`;粒子按各人语录数加权分配,加句子即加星

离线素材与重算命令(`tools/` 不进构建产物):

- `*-photo.jpg` 与 `emblem-ref.png` 只是脚本的输入;`public/*-mask.png` 和 `src/data/emblem.js` 是它们的产物,已一并入库 —— 不跑任何脚本也照样能 `npm run build`。
- 更换/校准肖像掩膜:`node tools/prepare-mask.mjs --only=<id> --preview`(输出分割边界核对图),去掉 `--preview` 即写回 `public/<id>-mask.png`。
- 重算徽章点位:`node tools/make-emblem.mjs`(读 `tools/emblem-ref.png`,覆写 `src/data/emblem.js`,勿手改)。
- 重绘 README 横幅:`node tools/make-banner.mjs`(读 `public/marx-mask.png`,覆写 `docs/banner.svg`)。

## 📄 许可与致谢

- 代码以 [MIT](LICENSE) 许可发布;
- 肖像照片均来自 [Wikimedia Commons](https://commons.wikimedia.org) 公有领域藏品;徽章底图取自 Commons 上 CC0 授权的党徽标准图形;语录仅供学习交流,版权归原作者与译者所有;
- 灵感致敬刘慈欣《诗云》、[shiyun.cohenjikan.com](https://shiyun.cohenjikan.com) 与每一位仰望星空的思想者。

<div align="center">

**「哲学家们只是用不同的方式解释世界,而问题在于改变世界。」**

[🌟 观看星图](https://luz7818.github.io/marx-cloud/) · [⭐ Star 本仓库](https://github.com/Luz7818/marx-cloud)

</div>
