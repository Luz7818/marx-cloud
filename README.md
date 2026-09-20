<div align="center">

<img src="docs/banner.svg" alt="思想云 · Marx Cloud" width="100%">

# 思想云 · Marx Cloud

**一张可漫游的马克思主义经典星图**

万点星辰,随视角流转,汇成思想的肖像 —— 每颗星,都是一句经典。

[![在线演示](https://img.shields.io/badge/%F0%9F%8C%90%20%E5%9C%A8%E7%BA%BF%E6%BC%94%E7%A4%BA-GitHub%20Pages-8a2be2?style=flat-square)](https://luz7818.github.io/marx-cloud/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r1xx-white?style=flat-square)](https://threejs.org/)
[![语录](https://img.shields.io/badge/%E7%BB%8F%E5%85%B8%E8%AF%AD%E5%BD%95-177%20%E5%8F%A5-e5484d?style=flat-square)](src/data/quotes.js)
[![思想家](https://img.shields.io/badge/%E6%80%9D%E6%83%B3%E5%AE%B6-21%20%E4%BD%8D-ff8a5c?style=flat-square)](src/data/figures.js)

**[在线演示](https://luz7818.github.io/marx-cloud/)** · [特性](#-特性) · [玩法](#-玩法) · [本地运行](#-本地运行) · [技术架构](#-技术架构) · [编辑内容](#%EF%B8%8F-编辑内容)

</div>

---

> 💫 灵感致敬刘慈欣《诗云》与 [shiyun.cohenjikan.com](https://shiyun.cohenjikan.com):
> 神级文明把所有可能的诗都写成恒星,存进一片星云。
> 这里把两百年来写下的经典,存进万点星辰。

## ✨ 特性

- 🌌 **四向星云肖像** —— 星云绕轴流转,每转过 **90°** 便聚合成一位思想家的肖像:**马克思 → 恩格斯 → 列宁 → 卢森堡**;45° 过渡区散作漫天星雾,聚散只在视角之间。
- 💬 **每颗星都是一句经典** —— 177 句语录、21 位思想家,悬停预览、点击展开语录卡(原文 / 著作 / 年份 / 编号);点击虚空,随机"从虚空捞起一句"。
- 🎨 **思想家星群** —— 每位思想家一种专属色;侧栏一键点亮,属于自己的星辰在云海中亮起。
- 🚶 **自动巡游** —— 进入星图后相机自动巡游:每个像位停留片刻,再缓缓转过 90° 换下一位;拖拽随时接管,空闲后自动恢复。
- 📱 **全端自适应** —— 移动端触控、捏合缩放;软件渲染与低帧率环境自动降载,GPU 环境满血 46,000 粒子。
- ⚡ **零依赖前端** —— 仅 Three.js 一个运行时依赖,构建产物 gzip 约 137 kB,纯静态、任意托管即用。

## 🎮 玩法

| 操作 | 效果 |
| :--- | :--- |
| **拖拽** | 旋转星云 —— 每转过 90° 聚合出下一位思想家,底部字幕随之更名 |
| **滚轮 / 双指捏合** | 缩放,可穿入星云内部 |
| **悬停星尘** | 浮出气泡:思想家 + 语录预览 |
| **点击星尘** | 展开语录卡:原文、著作、年份、编号 |
| **点击虚空** | 彩蛋:从虚空随机捞起一句经典 |
| **左栏人物** | 点亮该思想家的星群,再点复位 |
| **Esc** | 关闭语录卡 |

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
                                              │
                              mask.js CDF 逆变换采样 ×4 平面
                                              ▼
      cloud.js ShaderMaterial ◀── scene.js 相机方位角 → 四平面权重 uW0..uW3
      星云位 ↔ 四组肖像位(顶点属性混合)          │
                                              ▼
                              main.js 装配 · 拾取 · 字幕 · 自适应
```

- **掩膜管线**:公有领域照片 → 手工描摹剪影多边形 + 五官负形椭圆 + 衣领抑制 → 亮度掩膜;`--preview` / `--overlay` 目视标定模式迭代。
- **四向变形**:四块互成 90° 的肖像平面各存一份粒子位置,顶点着色器按相机方位权重混合 —— 转肩即散、对位即聚,无任何骨架或 morph 动画。
- **O(1) 拾取**:按当前成形平面把粒子索引进空间哈希网格,46k 粒子最近邻拾取常数时间。
- **性能韧性**:软件渲染检测自动降粒子;<22fps 逐级下调绘制数;rAF 节流兜底驱动;零视口自愈(嵌入式 webview 冷启动)。

## ✏️ 编辑内容

内容全部集中在两个文件,改完刷新即生效,界面与粒子分配自动更新:

- [`src/data/figures.js`](src/data/figures.js) — 人物元数据(姓名、生卒、地区、简介、专属色、分组)
- [`src/data/quotes.js`](src/data/quotes.js) — 语录数组 `{ f: 人物id, w: 著作, y: 年份, t: 原文 }`

更换/校准肖像掩膜见 [README·掩膜工具](tools/prepare-mask.mjs)(`--preview` 标定 / `--overlay` 核对)。

## 📄 许可与致谢

- 代码以 [MIT](LICENSE) 许可发布;
- 肖像照片均来自 [Wikimedia Commons](https://commons.wikimedia.org) 公有领域藏品;语录仅供学习交流,版权归原作者与译者所有;
- 灵感致敬刘慈欣《诗云》、[shiyun.cohenjikan.com](https://shiyun.cohenjikan.com) 与每一位仰望星空的思想者。

<div align="center">

**「哲学家们只是用不同的方式解释世界,而问题在于改变世界。」**

[🌟 观看星图](https://luz7818.github.io/marx-cloud/) · [⭐ Star 本仓库](https://github.com/Luz7818/marx-cloud)

</div>
