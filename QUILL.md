# QUILL · 记账小助手（FinTrack）

> Quill 在本项目的活动台账。各 `/quill:*` 命令会读取并追加此文件。

## 能力清单

- `/quill:ui` ✅ —— UI 风格 skill 工厂
- `/quill:prd` ⬜
- `/quill:hld` ⬜
- `/quill:dev` ⬜
- `/quill:test` ⬜
- `/quill:test-lite` ✅ —— 核心轻量测试

## 产物完成度

- [x] UI 风格 skill —— `style/fintrack-bento`（微信绿 × Bento 视觉 × 小程序跟手交互系统）
  - 位置：`~/.claude/quill-skills/skills/style/fintrack-bento/index.md`（全局，受保护不被 update 删）
  - 交互第一公民：WXS 跟手按压 / 手势（左滑·长按）/ 动作确认闭环；视觉为第二层
  - 适用：`**/*.wxml,**/*.wxss,**/*.js,**/*.wxs,**/*.json`

## 最近活动

- 2026-06-10 `/quill:ui` 产出 `style/fintrack-bento`：定义 Bento 视觉 + 小程序原生跟手交互系统（保留微信绿 #07C160，WebView 方案，Skyline 列为可选升级位）。下一步 `/quill:dev` 落地 home / stats / scan 三类页。
- 2026-06-11 `/quill:test-lite` 测「记一笔重设计」未提交改动：后端 source 字段 + timeline 聚合层 + 自定义 tabBar + add 页重写。语法/SQL split/INSERT 占位符均 PASS，timeline 聚合逻辑冒烟通过（manual 过滤 / batch 聚合 / 按天分组正确）。无 lint/tsc 配置（纯 WX/Node JS）。
