---
name: wes-anderson-style
description: 当你需要构建具有韦斯·安德森电影美学的前端页面时，使用本技能获取完整的配色、排版、布局和组件规范
category: frontend-styles
version: "2.0.0"
tags: [frontend, ui-style, wes-anderson, pastel, retro, symmetry, landing-page, creator-economy, ai-saas]
---

# 韦斯·安德森风格 — 前端设计系统

将韦斯·安德森电影的视觉美学转化为可直接落地的前端设计规范。核心关键词：**对称 · 柔和粉彩 · 复古排版 · 精致细节 · 故事感**。

## 使用场景

- 构建品牌官网、产品落地页，需要"高级感 + 艺术气质"的视觉调性
- 设计创意型 SaaS 产品（内容创作、AI 工具、设计平台）的前端界面
- Creator Economy 产品（如 viralt.ai 类 AI 创作者工具）的官网和仪表盘
- 需要在常见的科技感风格之外，打造独特的怀旧温暖视觉体验
- 作品集、个人站、杂志风格、摄影博客、咖啡品牌页面
- 活动邀请页、产品发布页等需要"戏剧性仪式感"的单页

## 核心原则

1. **对称构图至上**：所有布局以中轴线对称为第一优先级，正面平视视角（Planimetric），避免不对称的随意排列
2. **精选粉彩调色板**：每个页面/项目使用一套 5 色调色板（来自同一色系），中性色占 70%，粉彩色占 25%，强调色仅 5%
3. **复古排版系统**：标题使用 Futura 或几何无衬线体（全大写），正文使用优雅衬线体，字间距宽松，营造"电影片头"般的排版感
4. **精致细节执念**：边框、分隔线、图标等微小元素都需精心设计，体现"每一帧都是画"的品质感
5. **叙事感动效**：动画克制而优雅，如"翻书页""拉开幕布""定格画面"，而非科技感十足的渐入渐出

## 配色系统

### 主题调色板（6 套可选）

基于韦斯·安德森经典电影提取，每套 5 色：

```
布达佩斯大饭店（温暖粉红）— 最具代表性
  #F1BB93  奶油杏    → 背景色 / 大面积填充
  #E89B93  蜜桃粉    → 卡片背景 / 次要区域
  #D96B7C  玫瑰红    → 强调色 / CTA 按钮
  #A13B5D  酒红      → 标题文字 / 重要元素
  #5B2439  深莓红    → 深色文字 / 页脚背景

月升王国（自然绿调）
  #E6DCA6  麦穗黄    → 背景色
  #BECBA4  苔藓绿    → 卡片背景
  #9FA8A3  雾灰绿    → 次要元素
  #7D7C87  石板灰    → 正文文字
  #5D4F63  暗紫灰    → 标题文字

天才一族（暖棕系）
  #CFBDA2  浅驼色    → 背景色
  #C1A391  暖沙棕    → 卡片背景
  #B38C81  赤陶      → 强调色
  #A4736D  红木      → 按钮 / 标题
  #905452  深砖红    → 深色文字

了不起的狐狸爸爸（秋日暖橘）
  #CEB780  蜜金      → 背景色
  #B89E66  琥珀黄    → 卡片背景
  #A4854D  焦糖      → 强调色
  #8E6D34  棕榈棕    → 按钮
  #7A551C  深栗      → 标题文字

海海人生（清冷蓝绿）
  #E5EDE9  薄荷白    → 背景色
  #CCD7D0  浅灰绿    → 卡片背景
  #9EB8B6  海雾绿    → 次要元素
  #6A8E8F  深海绿    → 强调色 / 按钮
  #3D5C5D  墨绿      → 标题文字

法兰西特派（淡雅紫调）
  #F2E6F1  薰衣草白  → 背景色
  #E0D1DF  丁香灰    → 卡片背景
  #C2B4C2  藕荷紫    → 次要元素
  #A496A6  灰紫      → 强调色
  #6B5A6E  深紫灰    → 标题文字
```

### 配色使用规则

```
背景层:   调色板[0] — 大面积背景，柔和不刺眼
内容层:   调色板[1] — 卡片、区块的容器背景
辅助层:   调色板[2] — 分隔线、标签、徽章背景
强调层:   调色板[3] — 按钮、链接、重要标记
文字层:   调色板[4] — 标题、主文字

中性文字: #4A3F35（温暖深棕，替代纯黑）
次要文字: #8C7E72（暖灰棕）
白色文字: #FDF8F0（奶白，替代纯白）
```

### 扩展配色（场景级补充）

基于电影场景级分析的补充色值，用于丰富单套调色板的表现力：

```
布达佩斯大饭店 — 场景扩展色
  #F4A8B9  棉花糖粉  → 酒店外墙 / Hero 背景变体
  #8B5FBF  皇家紫    → 制服/徽章 / 高亮装饰
  #D9381E  热烈红    → 紧急 CTA / 错误状态
  #E6A0C4  浅粉紫    → hover 状态背景
  #C6CDF7  薰衣草蓝  → 信息提示 / 标签背景
  #D8A499  陶土粉    → 次级按钮 / 辅助卡片
  #7294D4  水彩蓝    → 链接色 / 进度条
  #FD6467  珊瑚红    → 通知徽章 / 计数器

了不起的狐狸爸爸 — 场景扩展色
  #F4A701  南瓜橙    → 强 CTA / 高亮标签
  #A4755F  沙棕      → 表格斑马行
  #55332C  巧克力棕  → 页脚深色背景
  #5C1F00  深焦糖    → 深色模式文字

通用粉彩系 — 混搭辅助（可与任意主调色板搭配的中性粉彩）
  #E6A8B5  蒙尘粉    → 柔和警告
  #F4D35E  芥末黄    → 新功能标记 / NEW 标签
  #A7C5EB  天空蓝    → 信息卡片
  #8BAF9F  灰薄荷    → 成功状态
  #B78B56  棕土      → 边框 / 分隔线
```

### 色彩心理学映射

根据页面目标选择调色板：

| 目标情绪 | 推荐调色板 | 原因 |
|---------|-----------|------|
| 温暖 / 亲切 / 浪漫 | 布达佩斯大饭店 | 粉红系唤起童话般的温暖感 |
| 冒险 / 活力 / 好奇 | 月升王国 | 自然绿调激发探索欲 |
| 经典 / 权威 / 家族感 | 天才一族 | 暖棕系传递老钱质感 |
| 俏皮 / 勇敢 / 机敏 | 狐狸爸爸 | 暖橘系带来积极能量 |
| 沉静 / 探索 / 深邃 | 海海人生 | 蓝绿系营造深海般的沉浸感 |
| 优雅 / 文艺 / 知性 | 法兰西特派 | 紫灰系散发法式知性气质 |

### 配色禁止

- 不使用纯黑 `#000000` 和纯白 `#FFFFFF`，用暖色调的深色和浅色替代
- 不混用两套调色板，一个页面/项目只用一套（扩展色除外）
- 强调色面积不超过 5%，避免破坏柔和氛围
- 不使用高饱和霓虹色（如 `#00FF00`、`#FF00FF`），与复古调性冲突
- 渐变仅允许同色系两色之间的极微弱渐变（如 `#F1BB93` → `#E89B93`），不允许跨色相渐变

## 排版系统

### 字体选择

```css
/* 标题字体 — 几何无衬线 */
--font-display: 'Futura PT', 'Century Gothic', 'Avenir', system-ui;

/* 正文字体 — 优雅衬线 */
--font-body: 'Playfair Display', 'Lora', 'Georgia', serif;

/* 等宽辅助（标签、代码、数据） */
--font-mono: 'Courier Prime', 'Courier New', monospace;
```

### 排版层级

```css
/* 超大标题（Hero） */
.heading-hero {
  font-family: var(--font-display);
  font-size: 56px;
  line-height: 1.1;
  font-weight: 700;
  letter-spacing: 0.12em;    /* 宽字距是灵魂 */
  text-transform: uppercase;
  text-align: center;
}

/* 章节标题 */
.heading-section {
  font-family: var(--font-display);
  font-size: 32px;
  line-height: 1.2;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
}

/* 卡片标题 */
.heading-card {
  font-family: var(--font-display);
  font-size: 20px;
  line-height: 1.3;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* 正文 */
.body-text {
  font-family: var(--font-body);
  font-size: 17px;
  line-height: 1.7;
  font-weight: 400;
  letter-spacing: 0.02em;
}

/* 标注 / 小字 */
.caption-text {
  font-family: var(--font-display);
  font-size: 12px;
  line-height: 1.5;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}
```

### 字体替代方案速查

| 定位 | 首选（商业） | Google Fonts 免费替代 | 系统字体兜底 |
|------|-------------|---------------------|-------------|
| 标题 | Futura PT | Jost / Josefin Sans | Century Gothic / Avenir |
| 正文 | Baskerville | Playfair Display / Lora / EB Garamond | Georgia |
| 等宽 | Courier Prime | Courier Prime (免费) | Courier New |
| 手写/装饰 | — | Cormorant Garamond / Libre Baskerville | — |

### 排版规则

- 标题一律 `uppercase` + 宽 `letter-spacing`，营造"电影海报"感
- 正文用衬线体，增加文学性和可读性
- 文字对齐以居中为主，左对齐仅用于长段落正文
- 段落间距使用 `2em`，行间距 `1.7`，留白充裕
- 数字使用等宽字体或带衬线数字的正文字体（old-style figures 为佳）
- 引号使用弯引号 `""''`，不用直引号
- 破折号使用 em dash `—`，两侧留半角空格

### 排版特殊手法

```css
/* 章节编号 — 电影分幕感 */
.wa-chapter-number {
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}
/* 用法: CHAPTER I / PART ONE / ACT II */

/* 引言 / 格言 — 大号斜体衬线 */
.wa-quote {
  font-family: var(--font-body);
  font-size: 24px;
  font-style: italic;
  line-height: 1.6;
  text-align: center;
  color: var(--color-accent);
  max-width: 640px;
  margin: 0 auto;
  padding: 40px 0;
}

/* 标签文字 — 全大写极宽字距 */
.wa-label {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}
```

## 布局系统

### 对称网格

```css
/* 核心容器 — 居中对称 */
.wa-container {
  max-width: 1120px;
  margin: 0 auto;
  padding: 0 48px;
  text-align: center;
}

/* 对称两列 */
.wa-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: center;
}

/* 对称三列 */
.wa-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* 对称四列 */
.wa-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
```

### 页面结构模板

```
┌──────────────────────────────────────────────────────────┐
│              ┌─────────────────────┐                     │
│              │    BRAND LOGO       │  ← 居中 Logo        │
│              └─────────────────────┘                     │
│         NAV1    NAV2    NAV3    NAV4    ← 居中导航        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              THE MAIN HEADLINE                           │  ← Hero 区域
│              ─────────────────                           │    居中对称
│         A short, elegant description                     │    装饰性分隔线
│              [ GET STARTED ]                             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│              ✦  SECTION TITLE  ✦                         │  ← 装饰符号
│                                                          │
│    ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│    │  Card 1  │  │  Card 2  │  │  Card 3  │             │  ← 对称卡片
│    │  icon    │  │  icon    │  │  icon    │             │
│    │  text    │  │  text    │  │  text    │             │
│    └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│    ┌─────────────────┬─────────────────┐                 │
│    │                 │                 │                 │  ← 对称双列
│    │   Image         │   Text Block    │                 │
│    │                 │                 │                 │
│    └─────────────────┴─────────────────┘                 │
│                                                          │
├──────────────────────────────────────────────────────────┤
│              ─── FOOTER TEXT ───                          │  ← 居中页脚
│              © BRAND NAME MMXXVI                          │    罗马数字年份
└──────────────────────────────────────────────────────────┘
```

### 间距规律

```css
/* 8pt 网格，但偏好更大的留白 */
--space-xs:  8px;
--space-sm:  16px;
--space-md:  32px;
--space-lg:  64px;
--space-xl:  96px;
--space-2xl: 128px;

/* Section 之间: 96px ~ 128px（大量留白 = 高级感） */
/* 卡片内部 padding: 32px ~ 48px */
/* 元素之间: 16px ~ 32px */
```

### 布局禁止

- 不使用不对称布局（左右不均等）
- 不使用瀑布流或 masonry 布局
- 奇数列内容必须居中，两侧留等宽空白
- 不将内容推到边缘，容器两侧始终保持 48px+ 的 padding

## 组件设计

### 按钮

```css
/* 主按钮 — 复古感 */
.wa-btn-primary {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 14px 36px;
  border: 2px solid currentColor;
  border-radius: 2px;           /* 近乎直角，复古感 */
  background: var(--color-accent);
  color: var(--color-light);
  cursor: pointer;
  transition: all 0.3s ease;
}

.wa-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 次按钮 — 幽灵风格 */
.wa-btn-ghost {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 14px 36px;
  border: 2px solid var(--color-accent);
  border-radius: 2px;
  background: transparent;
  color: var(--color-accent);
  cursor: pointer;
  transition: all 0.3s ease;
}

.wa-btn-ghost:hover {
  background: var(--color-accent);
  color: var(--color-light);
}
```

### 卡片

```css
.wa-card {
  background: var(--color-card-bg);
  border: 1.5px solid var(--color-border);
  border-radius: 4px;            /* 微圆角 */
  padding: 40px 32px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
}

/* 卡片顶部装饰线 */
.wa-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  height: 3px;
  background: var(--color-accent);
}

.wa-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}
```

### 分隔线（装饰性）

```css
/* 标题装饰分隔线 */
.wa-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin: 32px 0;
}

.wa-divider::before,
.wa-divider::after {
  content: '';
  width: 60px;
  height: 1px;
  background: var(--color-accent);
}

/* 星号装饰: ✦ ─── TITLE ─── ✦ */
/* 菱形装饰: ◆ ─── TITLE ─── ◆ */
```

### 输入框

```css
.wa-input {
  font-family: var(--font-body);
  font-size: 16px;
  padding: 12px 20px;
  border: 1.5px solid var(--color-border);
  border-radius: 2px;
  background: var(--color-light);
  color: var(--color-text);
  text-align: center;
  transition: border-color 0.3s ease;
}

.wa-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.wa-input::placeholder {
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}
```

### 导航栏

```css
.wa-nav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  padding: 24px 0;
  border-bottom: 1px solid var(--color-border);
}

.wa-nav-link {
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--color-text);
  position: relative;
}

/* 下划线 hover 效果 */
.wa-nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 1.5px;
  background: var(--color-accent);
  transition: width 0.3s ease;
}

.wa-nav-link:hover::after {
  width: 100%;
}
```

## 纹理与图案系统

韦斯·安德森的画面从不"干净平滑"，总有材质感。数字界面中通过纹理暗示物理质感。

### CSS 纹理实现

```css
/* 亚麻纸纹理 — 适合大面积背景 */
.wa-texture-linen {
  background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='4' height='4' fill='%23F1BB93'/%3E%3Crect width='1' height='1' x='0' y='0' fill='%23E8B48A' opacity='0.3'/%3E%3Crect width='1' height='1' x='2' y='2' fill='%23E8B48A' opacity='0.2'/%3E%3C/svg%3E");
}

/* 细横线纹理 — 适合卡片背景 */
.wa-texture-lined {
  background-image: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 23px,
    var(--color-border) 23px,
    var(--color-border) 24px
  );
}

/* 圆点图案 — 适合装饰区域 */
.wa-texture-dots {
  background-image: radial-gradient(
    circle,
    var(--color-accent) 0.8px,
    transparent 0.8px
  );
  background-size: 16px 16px;
  opacity: 0.15;
}

/* 复古纸张噪点 — 叠加在任意背景上 */
.wa-texture-grain::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  pointer-events: none;
  z-index: 1;
}
```

### 纹理使用规则

```
背景层:   亚麻纸纹理或纯色 + 噪点叠加，不要完全平滑
卡片层:   可选横线纹理（模拟信纸/记事本），或纯色 + 微噪点
装饰层:   圆点图案作为 section 之间的过渡装饰带
图片层:   胶片颗粒感滤镜（见图片处理章节）

纹理透明度: 0.03 ~ 0.08（若隐若现，不喧宾夺主）
```

## 阴影与光感系统

韦斯·安德森的光线平坦均匀（flat lighting），阴影柔和且方向统一。

```css
:root {
  /* 阴影全部偏暖 — 使用主调色板的深色，而非灰/黑 */
  --wa-shadow-color: var(--color-text);

  /* 层级阴影 */
  --wa-shadow-sm:  0 1px 3px  color-mix(in srgb, var(--wa-shadow-color) 6%, transparent);
  --wa-shadow-md:  0 4px 8px  color-mix(in srgb, var(--wa-shadow-color) 8%, transparent);
  --wa-shadow-lg:  0 8px 24px color-mix(in srgb, var(--wa-shadow-color) 10%, transparent);
  --wa-shadow-xl:  0 16px 48px color-mix(in srgb, var(--wa-shadow-color) 12%, transparent);

  /* 内阴影 — 模拟凹进的物理感（如输入框聚焦） */
  --wa-shadow-inset: inset 0 2px 4px color-mix(in srgb, var(--wa-shadow-color) 8%, transparent);
}
```

### 阴影规则

- 阴影色使用调色板深色而非 `rgba(0,0,0,x)`，保持色调一致
- 阴影始终朝下（光源从正上方），不使用四周散射阴影
- 卡片默认无阴影，hover 时才显现 `--wa-shadow-md`
- 弹窗/对话框使用 `--wa-shadow-xl` + 背景暗幕

## 图标风格指南

### 图标设计原则

韦斯·安德森的道具都像精心制作的微缩模型。图标风格应体现这种手工精致感。

```
风格: 线性图标（line icon），1.5px 线宽，圆角端点
大小: 20×20px（正文内联）/ 32×32px（卡片图标）/ 48×48px（功能展示）
颜色: 单色，使用 currentColor 继承文字色
```

### 推荐图标库

| 库名 | 适配度 | 说明 |
|------|--------|------|
| Phosphor Icons | ★★★★★ | thin/light 变体完美匹配，优雅精致 |
| Lucide | ★★★★☆ | 1.5px 线宽，简洁克制 |
| Tabler Icons | ★★★☆☆ | 需要调细线宽到 1.5px |

### 图标禁止

- 不使用填充型（solid/filled）图标 — 过于厚重
- 不使用彩色多色图标 — 破坏单色调性
- 不使用 3D 或拟物图标
- 不使用 emoji 代替图标

### 自定义图标风格 CSS

```css
.wa-icon {
  width: 1.25em;
  height: 1.25em;
  stroke-width: 1.5;
  stroke: currentColor;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* 大尺寸展示图标 — 带装饰圆圈 */
.wa-icon-featured {
  width: 48px;
  height: 48px;
  padding: 16px;
  border: 1.5px solid var(--color-border);
  border-radius: 50%;          /* 图标容器用正圆，是唯一允许大圆角的场景 */
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## 动效规范

### 基本原则

韦斯·安德森的镜头语言：**精准、克制、戏剧性**。动画应如同"定格动画"般有节奏感。

```css
/* 入场动画 — 从下方优雅升起 */
@keyframes wa-rise {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 幕布展开 — 从中心向两侧 */
@keyframes wa-curtain {
  from {
    clip-path: inset(0 50%);
  }
  to {
    clip-path: inset(0 0);
  }
}

/* 打字机效果 — 逐字显现 */
@keyframes wa-typewriter {
  from { width: 0; }
  to { width: 100%; }
}

/* 统一时间曲线 */
--ease-elegant: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--duration-short: 0.3s;
--duration-medium: 0.6s;
--duration-long: 1.2s;
```

### 滚动触发（Intersection Observer）

```
元素入场: wa-rise, duration 0.6s, stagger 0.1s（相邻元素依次入场）
图片入场: wa-curtain, duration 0.8s
标题入场: 淡入 + 字间距从 0.3em 收缩到目标值, duration 0.8s
```

### 动效禁止

- 不使用弹跳（bounce）或果冻（elastic）效果
- 不使用 3D 旋转或透视变换
- 不使用粒子、光效、渐变动画等科技感效果
- 页面切换不使用滑动，使用淡入淡出（如"电影转场"）

## 装饰元素

### 常用装饰符号

```
✦  四角星    — 标题两侧装饰
◆  菱形      — 列表标记
─  长横线    — 分隔线
│  竖线      — 侧边装饰
※  米字      — 注释标记
→  箭头      — 链接指示
MMXXVI      — 罗马数字年份（页脚）
```

### 装饰边框模式

```css
/* 双线边框 — 经典复古 */
.wa-frame-double {
  border: 1px solid var(--color-border);
  outline: 1px solid var(--color-border);
  outline-offset: 4px;
}

/* 角落装饰 */
.wa-frame-corner {
  position: relative;
  border: 1px solid var(--color-border);
}
.wa-frame-corner::before,
.wa-frame-corner::after {
  content: '✦';
  position: absolute;
  font-size: 10px;
  color: var(--color-accent);
}
.wa-frame-corner::before { top: -6px; left: -6px; }
.wa-frame-corner::after { bottom: -6px; right: -6px; }
```

## 图片处理

```css
/* 所有图片 — 柔和处理 */
.wa-image {
  border-radius: 2px;
  filter: saturate(0.85) contrast(0.95);  /* 略微降饱和，营造胶片感 */
  border: 1px solid var(--color-border);
}

/* 头像 — 正方形 + 细边框 */
.wa-avatar {
  width: 80px;
  height: 80px;
  border-radius: 2px;
  border: 2px solid var(--color-accent);
  object-fit: cover;
}
```

## 完整页面组件库

### Hero 区域

```html
<!-- Hero — 电影开幕式 -->
<section class="wa-hero">
  <p class="wa-label">✦ INTRODUCING ✦</p>
  <h1 class="heading-hero">YOUR BRAND<br>HEADLINE HERE</h1>
  <div class="wa-divider">
    <span>───</span>
    <span>◆</span>
    <span>───</span>
  </div>
  <p class="body-text" style="max-width: 560px; margin: 0 auto;">
    A short, elegant description that reads like the opening
    narration of a Wes Anderson film.
  </p>
  <div style="margin-top: 40px; display: flex; gap: 16px; justify-content: center;">
    <button class="wa-btn-primary">GET STARTED</button>
    <button class="wa-btn-ghost">WATCH FILM</button>
  </div>
</section>
```

```css
.wa-hero {
  text-align: center;
  padding: 128px 48px;
  position: relative;
  overflow: hidden;
}

/* Hero 背景装饰框 — 居中的大矩形虚线 */
.wa-hero::before {
  content: '';
  position: absolute;
  top: 48px; bottom: 48px;
  left: 10%; right: 10%;
  border: 1px dashed var(--color-border);
  pointer-events: none;
}
```

### Feature 展示区（三列对称）

```html
<section class="wa-section">
  <p class="wa-chapter-number">CHAPTER I</p>
  <h2 class="heading-section">HOW IT WORKS</h2>
  <div class="wa-divider"><span>─────</span><span>✦</span><span>─────</span></div>

  <div class="wa-grid-3" style="margin-top: 64px;">
    <div class="wa-card">
      <div class="wa-icon-featured"><!-- icon --></div>
      <h3 class="heading-card" style="margin-top: 24px;">FEATURE ONE</h3>
      <p class="body-text" style="margin-top: 12px;">
        Description in serif typeface, warm and inviting.
      </p>
    </div>
    <!-- Card 2, Card 3 同理 -->
  </div>
</section>
```

```css
.wa-section {
  padding: 96px 48px;
  text-align: center;
}

/* 交替背景色 — 偶数 section 使用卡片背景色 */
.wa-section:nth-child(even) {
  background: var(--color-card-bg);
}
```

### 数据/指标展示（带复古编号）

```html
<div class="wa-grid-3">
  <div class="wa-stat">
    <span class="wa-stat-number">No. 01</span>
    <span class="wa-stat-value">12,847</span>
    <span class="wa-stat-label">CREATORS SERVED</span>
  </div>
  <!-- No. 02, No. 03 同理 -->
</div>
```

```css
.wa-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 24px;
}

.wa-stat-number {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.15em;
  color: var(--color-text-secondary);
}

.wa-stat-value {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-text);
}

.wa-stat-label {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}
```

### Testimonial / 用户证言

```html
<section class="wa-section">
  <p class="wa-chapter-number">CHAPTER III</p>
  <h2 class="heading-section">WHAT THEY SAY</h2>
  <div class="wa-divider"><span>─────</span><span>✦</span><span>─────</span></div>

  <div class="wa-testimonial">
    <blockquote class="wa-quote">
      "This changed everything about the way I create content.
       It's like having a personal director."
    </blockquote>
    <div class="wa-testimonial-author">
      <img class="wa-avatar" src="..." alt="Author" />
      <div>
        <p class="wa-label">SARAH CHEN</p>
        <p class="caption-text" style="letter-spacing: 0.08em;">Content Creator, 240K Followers</p>
      </div>
    </div>
  </div>
</section>
```

```css
.wa-testimonial {
  max-width: 640px;
  margin: 48px auto 0;
  text-align: center;
}

.wa-testimonial-author {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}
```

### 价格/计划卡片

```css
.wa-pricing-card {
  background: var(--color-card-bg);
  border: 1.5px solid var(--color-border);
  border-radius: 4px;
  padding: 48px 32px;
  text-align: center;
  position: relative;
}

/* 推荐计划 — 强调边框 + 顶部标签 */
.wa-pricing-card--featured {
  border-color: var(--color-accent);
  border-width: 2px;
}

.wa-pricing-card--featured::before {
  content: '✦ RECOMMENDED ✦';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-accent);
  color: var(--color-light);
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  padding: 4px 20px;
  border-radius: 2px;
}

.wa-price {
  font-family: var(--font-display);
  font-size: 48px;
  font-weight: 700;
  color: var(--color-text);
}

.wa-price-period {
  font-family: var(--font-display);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
}

/* 特性列表 — 用装饰符替代勾号 */
.wa-feature-list {
  list-style: none;
  padding: 0;
  margin: 32px 0;
}

.wa-feature-list li {
  font-family: var(--font-body);
  font-size: 15px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border);
}

.wa-feature-list li::before {
  content: '◆ ';
  color: var(--color-accent);
  font-size: 8px;
  vertical-align: middle;
  margin-right: 8px;
}
```

### CTA（行动号召）区域

```css
.wa-cta {
  text-align: center;
  padding: 96px 48px;
  background: var(--color-text);  /* 深色背景反转 */
  color: var(--color-light);
  position: relative;
}

/* 顶部波浪分隔 — 用 SVG 而非硬线 */
.wa-cta::before {
  content: '— ✦ —';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-text);
  padding: 0 24px;
  font-family: var(--font-display);
  font-size: 14px;
  letter-spacing: 0.3em;
  color: var(--color-light);
}
```

### 页脚

```css
.wa-footer {
  text-align: center;
  padding: 64px 48px 48px;
  border-top: 1px solid var(--color-border);
}

.wa-footer-brand {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.wa-footer-links {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-top: 24px;
}

.wa-footer-legal {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.1em;
  color: var(--color-text-secondary);
  margin-top: 32px;
}
/* 年份用罗马数字: © BRAND NAME · MMXXVI */
```

## 空状态与加载状态

### 空状态（Empty State）

安德森式空状态不是一片空白，而是一个"精心布置的空房间"。

```css
.wa-empty-state {
  text-align: center;
  padding: 80px 48px;
  max-width: 400px;
  margin: 0 auto;
}

.wa-empty-state-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 24px;
  opacity: 0.6;
}

.wa-empty-state-title {
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text);
}

.wa-empty-state-desc {
  font-family: var(--font-body);
  font-size: 15px;
  font-style: italic;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-top: 12px;
}
/* 示例文案风格:
   标题: "THE COLLECTION IS EMPTY"
   描述: "Nothing here yet — like an empty display case
          awaiting its first curious artifact."
   按钮: [ ADD YOUR FIRST ITEM ]
*/
```

### 骨架屏（Skeleton Loading）

```css
.wa-skeleton {
  background: linear-gradient(
    90deg,
    var(--color-card-bg) 25%,
    color-mix(in srgb, var(--color-card-bg) 85%, var(--color-light)) 50%,
    var(--color-card-bg) 75%
  );
  background-size: 200% 100%;
  animation: wa-skeleton-shimmer 1.5s ease infinite;
  border-radius: 2px;
}

@keyframes wa-skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* 骨架文字行 */
.wa-skeleton-text {
  height: 14px;
  margin-bottom: 10px;
}

.wa-skeleton-text:last-child {
  width: 60%; /* 最后一行短一些，模拟真实文本 */
  margin: 0 auto;
}

/* 骨架标题 */
.wa-skeleton-heading {
  height: 24px;
  width: 40%;
  margin: 0 auto 20px;
}
```

## 微交互细节

### Hover 效果矩阵

| 元素 | Hover 效果 | 过渡时间 |
|------|-----------|---------|
| 按钮 | 上移 2px + 阴影 md | 0.3s |
| 卡片 | 上移 3px + 阴影 lg | 0.3s |
| 导航链接 | 下划线从左向右展开 | 0.3s |
| 图片 | 微放大 1.02 + 阴影 | 0.4s |
| 图标 | 颜色变为强调色 | 0.2s |
| 标签/徽章 | 背景色加深 5% | 0.2s |
| 表格行 | 背景色变为卡片背景色 | 0.15s |

### Focus 可访问性

```css
/* 键盘焦点 — 使用调色板色的虚线轮廓 */
*:focus-visible {
  outline: 2px dashed var(--color-accent);
  outline-offset: 3px;
}

/* 鼠标焦点隐藏 */
*:focus:not(:focus-visible) {
  outline: none;
}
```

### 滚动行为

```css
html {
  scroll-behavior: smooth;
  scroll-padding-top: 80px; /* 为固定导航留空 */
}

/* 回到顶部按钮 */
.wa-scroll-top {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 44px;
  height: 44px;
  border: 1.5px solid var(--color-border);
  border-radius: 2px;
  background: var(--color-light);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s ease;
}

.wa-scroll-top.visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 页面过渡（SPA）

```css
/* 场景切换 — 如同电影换幕 */
.wa-page-enter {
  opacity: 0;
}
.wa-page-enter-active {
  opacity: 1;
  transition: opacity 0.6s var(--ease-elegant);
}
.wa-page-leave-active {
  opacity: 0;
  transition: opacity 0.3s var(--ease-elegant);
}
```

## 响应式设计详细规范

### 断点定义

```css
/* 韦斯安德森式命名（电影尺寸隐喻） */
--wa-bp-pocket:    480px;   /* 口袋相机 — 手机竖屏 */
--wa-bp-postcard:  768px;   /* 明信片 — 手机横屏/小平板 */
--wa-bp-notebook:  1024px;  /* 笔记本 — 平板/小桌面 */
--wa-bp-cinema:    1280px;  /* 电影院 — 桌面 */
--wa-bp-widescreen: 1440px; /* 宽银幕 — 大桌面 */
```

### 各断点适配规则

```css
/* 口袋相机 (<480px) */
@media (max-width: 479px) {
  .wa-container { padding: 0 24px; }
  .heading-hero { font-size: 32px; letter-spacing: 0.08em; }
  .heading-section { font-size: 24px; }
  .wa-grid-2, .wa-grid-3, .wa-grid-4 {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .wa-section { padding: 64px 24px; }
  .wa-hero { padding: 80px 24px; }
  .wa-hero::before { display: none; } /* 移除装饰框 */
  .wa-nav { gap: 24px; flex-wrap: wrap; }
  .wa-btn-primary, .wa-btn-ghost { width: 100%; }
  .wa-stat-value { font-size: 36px; }
  .wa-price { font-size: 36px; }
}

/* 明信片 (480-767px) */
@media (min-width: 480px) and (max-width: 767px) {
  .wa-container { padding: 0 32px; }
  .heading-hero { font-size: 40px; }
  .wa-grid-3 { grid-template-columns: 1fr; }
  .wa-grid-2 { grid-template-columns: 1fr; }
  .wa-grid-4 { grid-template-columns: repeat(2, 1fr); }
}

/* 笔记本 (768-1023px) */
@media (min-width: 768px) and (max-width: 1023px) {
  .wa-container { padding: 0 40px; }
  .heading-hero { font-size: 48px; }
  .wa-grid-3 { grid-template-columns: repeat(3, 1fr); }
  .wa-grid-4 { grid-template-columns: repeat(2, 1fr); }
}

/* 电影院+ (1024px+) — 使用默认样式 */
```

### 响应式核心原则

- 任何断点下都保持**居中对称**，降列但不偏移
- 移动端触摸目标最小 44×44px（按钮、链接、图标）
- 移动端字体不缩小到 14px 以下
- 装饰元素（虚线框、角落装饰）在 <768px 时隐藏，避免干扰
- 多列降为单列时，保持元素**从上到下的层级顺序**，不重排

## Creator Economy / AI SaaS 专项

> 基于 viralt.ai（Instagram 创作者 AI 经纪人）等产品的设计模式。

### 适配场景

面向创作者的 AI 工具（内容生成、粉丝管理、品牌合作）需要在"专业可信"和"创意自由"之间取得平衡。韦斯·安德森风格特别适合这类产品——它既精致又不刻板，既复古又不过时。

### 特有组件

```css
/* AI 对话气泡 — 复古电报风格 */
.wa-ai-bubble {
  background: var(--color-card-bg);
  border: 1.5px solid var(--color-border);
  border-radius: 4px;
  padding: 20px 24px;
  position: relative;
  max-width: 480px;
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.7;
}

.wa-ai-bubble::before {
  content: 'AI TALENT MANAGER';
  position: absolute;
  top: -10px;
  left: 16px;
  background: var(--color-bg);
  padding: 0 8px;
  font-family: var(--font-display);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-accent);
}

/* 用户气泡 */
.wa-user-bubble {
  background: var(--color-accent);
  color: var(--color-light);
  border-radius: 4px;
  padding: 16px 24px;
  max-width: 480px;
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.7;
  margin-left: auto;
}

/* 创作者资料卡 */
.wa-creator-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 32px;
  border: 1.5px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-card-bg);
}

.wa-creator-card .wa-avatar {
  width: 96px;
  height: 96px;
  margin-bottom: 20px;
}

.wa-creator-card .wa-creator-handle {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.wa-creator-card .wa-creator-stats {
  display: flex;
  gap: 24px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
}

/* 品牌合作卡片 */
.wa-deal-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  border: 1.5px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-card-bg);
  transition: all 0.3s ease;
}

.wa-deal-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--wa-shadow-md);
}

.wa-deal-card .wa-deal-status {
  font-family: var(--font-display);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  padding: 4px 12px;
  border: 1px solid currentColor;
  border-radius: 2px;
}

.wa-deal-status--pending  { color: var(--color-text-secondary); }
.wa-deal-status--active   { color: var(--color-accent); }
.wa-deal-status--complete { color: #8BAF9F; }

/* 内容日历格子 */
.wa-calendar-cell {
  aspect-ratio: 1;
  border: 1px solid var(--color-border);
  border-radius: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  font-family: var(--font-display);
  transition: all 0.2s ease;
}

.wa-calendar-cell--today {
  border-color: var(--color-accent);
  border-width: 2px;
}

.wa-calendar-cell--scheduled {
  background: var(--color-card-bg);
}

.wa-calendar-cell--scheduled::after {
  content: '◆';
  font-size: 6px;
  color: var(--color-accent);
  margin-top: 4px;
}
```

### Creator SaaS 文案风格

保持韦斯·安德森的叙事语气——像一个温文尔雅的旁白者：

```
CTA 按钮:
  ✓ "BEGIN YOUR STORY"          ✗ "Sign Up Free"
  ✓ "MEET YOUR AI MANAGER"     ✗ "Get Started Now"
  ✓ "EXPLORE THE COLLECTION"   ✗ "Browse Features"

标题:
  ✓ "THE ART OF GOING VIRAL"   ✗ "Go Viral with AI"
  ✓ "A BRIEF INTRODUCTION"     ✗ "About Us"
  ✓ "LETTERS OF PRAISE"        ✗ "Testimonials"

空状态:
  ✓ "NO COLLABORATIONS YET — THE STAGE AWAITS ITS FIRST ACT."
  ✗ "No data to display."

加载中:
  ✓ "PREPARING YOUR DOSSIER..."
  ✗ "Loading..."
```

## Tailwind CSS 快速映射

如果项目使用 Tailwind，将以上设计系统映射为自定义配置：

### 完整 CSS 变量表（复制即用）

```css
:root {
  /* === 调色板（布达佩斯大饭店主题）=== */
  --wa-bg:              #F1BB93;
  --wa-card-bg:         #E89B93;
  --wa-accent:          #D96B7C;
  --wa-accent-dark:     #A13B5D;
  --wa-deep:            #5B2439;

  /* 中性色 */
  --wa-text:            #4A3F35;
  --wa-text-secondary:  #8C7E72;
  --wa-light:           #FDF8F0;
  --wa-border:          color-mix(in srgb, var(--wa-text) 15%, transparent);

  /* 语义色（粉彩化） */
  --wa-success:         #8BAF9F;
  --wa-warning:         #F4D35E;
  --wa-error:           #D96B7C;
  --wa-info:            #A7C5EB;

  /* === 字体 === */
  --wa-font-display:    'Futura PT', 'Century Gothic', 'Avenir', system-ui;
  --wa-font-body:       'Playfair Display', 'Lora', 'Georgia', serif;
  --wa-font-mono:       'Courier Prime', 'Courier New', monospace;

  /* === 间距 === */
  --wa-space-xs:        8px;
  --wa-space-sm:        16px;
  --wa-space-md:        32px;
  --wa-space-lg:        64px;
  --wa-space-xl:        96px;
  --wa-space-2xl:       128px;

  /* === 阴影 === */
  --wa-shadow-sm:       0 1px 3px color-mix(in srgb, var(--wa-text) 6%, transparent);
  --wa-shadow-md:       0 4px 8px color-mix(in srgb, var(--wa-text) 8%, transparent);
  --wa-shadow-lg:       0 8px 24px color-mix(in srgb, var(--wa-text) 10%, transparent);
  --wa-shadow-xl:       0 16px 48px color-mix(in srgb, var(--wa-text) 12%, transparent);

  /* === 动效 === */
  --wa-ease:            cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --wa-duration-fast:   0.2s;
  --wa-duration:        0.3s;
  --wa-duration-slow:   0.6s;

  /* === 圆角 === */
  --wa-radius:          2px;
  --wa-radius-sm:       4px;
}

/* 切换调色板只需覆盖 5 个变量 */
/* 例如切换到"海海人生"主题: */
[data-theme="life-aquatic"] {
  --wa-bg:            #E5EDE9;
  --wa-card-bg:       #CCD7D0;
  --wa-accent:        #6A8E8F;
  --wa-accent-dark:   #3D5C5D;
  --wa-deep:          #2A3E3F;
}
```

### Tailwind 配置（完整版）

```js
// tailwind.config.js — 韦斯安德森设计系统
const plugin = require('tailwindcss/plugin')

module.exports = {
  theme: {
    extend: {
      colors: {
        wa: {
          bg:              'var(--wa-bg)',
          'card-bg':       'var(--wa-card-bg)',
          accent:          'var(--wa-accent)',
          'accent-dark':   'var(--wa-accent-dark)',
          deep:            'var(--wa-deep)',
          text:            'var(--wa-text)',
          'text-secondary':'var(--wa-text-secondary)',
          light:           'var(--wa-light)',
          border:          'var(--wa-border)',
          success:         'var(--wa-success)',
          warning:         'var(--wa-warning)',
          error:           'var(--wa-error)',
          info:            'var(--wa-info)',
        }
      },
      fontFamily: {
        'wa-display': ['var(--wa-font-display)'],
        'wa-body':    ['var(--wa-font-body)'],
        'wa-mono':    ['var(--wa-font-mono)'],
      },
      letterSpacing: {
        'wa-wide':   '0.06em',
        'wa-wider':  '0.08em',
        'wa-widest': '0.12em',
        'wa-extreme':'0.15em',
        'wa-label':  '0.2em',
      },
      borderRadius: {
        'wa':    '2px',
        'wa-sm': '4px',
      },
      spacing: {
        'wa-xs':      '8px',
        'wa-sm':      '16px',
        'wa-md':      '32px',
        'wa-lg':      '64px',
        'wa-xl':      '96px',
        'wa-2xl':     '128px',
        'wa-section': '96px',
        'wa-card':    '40px',
      },
      boxShadow: {
        'wa-sm': 'var(--wa-shadow-sm)',
        'wa-md': 'var(--wa-shadow-md)',
        'wa-lg': 'var(--wa-shadow-lg)',
        'wa-xl': 'var(--wa-shadow-xl)',
      },
      transitionTimingFunction: {
        'wa': 'var(--wa-ease)',
      },
      maxWidth: {
        'wa-content': '1120px',
        'wa-text':    '640px',
        'wa-narrow':  '480px',
      },
    }
  },
  plugins: [
    plugin(function({ addUtilities }) {
      addUtilities({
        '.wa-uppercase': {
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          fontFamily: 'var(--wa-font-display)',
        },
        '.wa-grain': {
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: '0',
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            pointerEvents: 'none',
            zIndex: '1',
          }
        },
        '.wa-film': {
          filter: 'saturate(0.85) contrast(0.95)',
        },
      })
    })
  ]
}
```

### Google Fonts 引入

```html
<!-- 在 <head> 中添加 -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Courier+Prime&display=swap" rel="stylesheet">
```

```css
/* 使用免费字体时的变量覆盖 */
:root {
  --wa-font-display: 'Josefin Sans', 'Century Gothic', system-ui;
  /* Josefin Sans 是最接近 Futura 的免费替代 */
}
```

## 操作步骤

1. 选择一套调色板（根据品牌调性从 6 套中选择）
2. 配置 CSS 变量或 Tailwind 主题，将调色板注入项目
3. 引入字体：Futura PT（或 Century Gothic 备选）+ Playfair Display
4. 按页面结构模板搭建 HTML 骨架，确保所有区域居中对称
5. 应用排版层级：标题 uppercase + 宽字距，正文衬线体 + 1.7 行高
6. 设计组件（按钮、卡片、输入框），遵循"直角 + 细边框 + 精致"风格
7. 添加装饰元素：分隔线装饰符、双线边框、角落点缀
8. 配置入场动效：元素依次升起，标题字距收缩，图片幕布展开
9. 图片统一加胶片滤镜（降饱和 + 降对比度）
10. 通读页面，检查对称性、留白充裕度和色彩比例

## 输出格式

技能执行后，按以下结构输出设计方案：

```markdown
## 设计方案

### 1. 选用调色板
- 主题: [电影名]
- 色值: [5 色列表 + 用途说明]

### 2. 页面结构
- [ASCII 结构图，标注每个区域的组件和对称关系]

### 3. 组件清单
- [逐一列出使用到的组件 + 对应的样式类名]

### 4. 完整代码
- [Vue3 / React / HTML + TailwindCSS 实现代码]

### 5. 自检确认

**构图与布局**
- [ ] 所有区域中轴对称
- [ ] Section 间距 ≥ 96px（桌面端）
- [ ] 容器两侧 padding ≥ 48px（桌面端）
- [ ] 多列网格使用偶数列或居中的奇数列
- [ ] Hero 区域有装饰性框线或分隔符

**配色**
- [ ] 使用完整的单套调色板（5 色）
- [ ] 无纯黑 #000000 和纯白 #FFFFFF
- [ ] 强调色面积 < 5%
- [ ] 阴影色使用调色板深色而非纯黑
- [ ] 渐变仅限同色系极微弱过渡

**排版**
- [ ] 标题全部 uppercase + letter-spacing ≥ 0.06em
- [ ] 标题使用几何无衬线体（Futura/Josefin Sans）
- [ ] 正文使用衬线体 + 1.7 行高
- [ ] 存在"章节编号"元素（CHAPTER I / PART ONE）
- [ ] 标签/小字使用 10-12px + 极宽字距

**组件**
- [ ] 按钮为近直角（border-radius: 2px）
- [ ] 卡片有装饰性顶部线条或边框
- [ ] 存在装饰性分隔线（✦ ─── TITLE ─── ✦）
- [ ] 空状态有"精心布置的空房间"式设计
- [ ] 骨架屏与最终布局结构一致

**图片与纹理**
- [ ] 图片有胶片感滤镜（saturate 0.85 + contrast 0.95）
- [ ] 背景有微弱纹理/噪点（opacity 0.03-0.08）
- [ ] 图标使用线性风格（1.5px 线宽）

**动效与交互**
- [ ] 动画克制 — 无弹跳/粒子/3D/霓虹效果
- [ ] 所有可交互元素有 hover 反馈
- [ ] 键盘焦点使用虚线轮廓（dashed）
- [ ] 入场动画使用依次升起（stagger）

**响应式**
- [ ] 移动端保持居中对称
- [ ] 触摸目标 ≥ 44×44px
- [ ] 装饰元素在 <768px 时隐藏

**文案风格**
- [ ] CTA 文案有叙事感（非"Sign Up"式直白）
- [ ] 空状态有温暖的比喻式描述
- [ ] 页脚年份使用罗马数字（MMXXVI）
```

## 注意事项

- 本风格适合品牌展示类页面（官网、落地页、作品集），不推荐用于数据密集型后台
- 宽字距 + uppercase 会降低长文可读性，正文段落必须切回衬线体正常排版
- 移动端需要将多列降为单列，但保持居中对称原则不变
- Futura PT 是商业字体，免费替代方案：Josefin Sans（最佳匹配）、Jost、Century Gothic（系统自带）
- Playfair Display / Lora / EB Garamond 均可通过 Google Fonts 免费使用
- 低饱和度配色方案在深色模式下需要重新调色，不建议简单反转
- `color-mix()` CSS 函数需要现代浏览器（Chrome 111+, Firefox 113+, Safari 16.4+），如需兼容旧浏览器则手动计算色值
- 噪点纹理使用内联 SVG data URI，不会产生额外网络请求
- 所有装饰性 `::before` / `::after` 伪元素设置 `pointer-events: none` 避免阻挡交互
- 调色板切换通过 CSS 变量实现（`[data-theme="xxx"]`），只需覆盖 5 个核心变量即可整体换肤

## 参考来源

本技能的设计规范综合自以下来源：

- 韦斯·安德森电影（布达佩斯大饭店、月升王国、天才一族、了不起的狐狸爸爸、海海人生、法兰西特派）的视觉分析
- viralt.ai（Instagram 创作者 AI 经纪人）的产品定位和 Creator Economy 设计模式
- Wes Anderson Color Palettes (bdevs.net / eggradients.com) 的色值提取
- "4 Elements of Wes Anderson-Inspired Web Design" (bittbox.com) 的网页设计映射
- "3 Things I Learned from Wes Anderson About Design" (medium.com/@jbibla) 的排版与色彩策略
- "Design Principles from Wes Anderson Films" (logomakerr.ai) 的对称与留白原则
- wesandersonJS (GitHub) 的程序化调色板方案
