# chatbi 前端项目

本目录为 chatbi（原 Vanna 项目二次开发版）的前端部分，基于 Next.js + TypeScript + Tailwind CSS 构建，旨在为智能数据分析和自然语言 BI 场景提供现代化、极致体验的 Web 界面。

---

## 项目定位

- **项目名称**：chatbi 前端
- **技术栈**：Next.js 14、TypeScript、Tailwind CSS、shadcn/ui
- **作用**：为后端 API（FastAPI）提供交互式、可扩展的用户界面，支持自然语言提问、数据可视化、会话管理等功能

## 目录结构

```
frontend/
├── app/           # Next.js App Router 入口及页面
├── components/    # 复用型 UI 组件（含主题切换、Logo等）
├── lib/           # 工具函数与前端业务逻辑
├── public/        # 静态资源
├── styles/        # 全局样式（Tailwind）
├── README.md      # 本说明文件
└── ...
```

## 快速启动

推荐使用 pnpm 进行依赖管理：

```bash
pnpm install
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看效果。

## 主要特性

- 现代化 UI/UX，响应式设计
- TypeScript 强类型，便于维护与扩展
- 与后端 FastAPI API 无缝集成
- 支持自定义主题、国际化扩展

## 参考

- 后端接口文档见 `../backend/README.md`
- 详细操作说明见项目根目录 `docs/`

---

如需自定义页面内容，可直接编辑 `app/page.tsx` 或各功能组件，保存后页面会自动热更新。

本项目已集成 next/font 字体优化方案，支持现代 Web 字体加载与性能提升。

如有更多前端开发、主题定制、组件扩展等需求，欢迎参考项目内代码或联系维护者 DellDi。
