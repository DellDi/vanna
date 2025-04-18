<!--
 * @Author: delldi 875372314@qq.com
 * @Date: 2025-04-18 14:56:31
 * @LastEditors: delldi 875372314@qq.com
 * @LastEditTime: 2025-04-18 15:40:07
 * @FilePath: \vanna\README.md
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
# chatbi（原 Vanna 项目二次开发版）

> 由 DellDi 基于 Vanna 项目 fork 并深度重构，聚焦于现代化、模块化的企业级数据智能 API 解决方案。

## 项目简介

chatbi 是一个以 FastAPI 为核心、前后端解耦、支持自然语言数据分析的开源项目。项目在原 Vanna 基础上，进行了架构升级与功能优化，现已支持更清晰的模块分层和更易扩展的开发体验。

- **主体维护人**：DellDi
- **原项目溯源**：fork 自 Vanna，现已全面升级为 chatbi

## 项目结构

```
├── backend    # 后端服务（FastAPI，核心API与业务逻辑）
├── frontend   # 前端静态资源（预留，支持自定义扩展）
├── main       # 项目主入口、运行脚本、数据与文档
│   ├── assets
│   ├── data
│   ├── docs   # 操作文档、研究报告等（详细见此目录）
│   └── run.py
├── README.md  # 项目简介（本文件）
└── CHANGELOG.md
```

## 快速开始

- 环境变量

```bash
cp .env.template .env
```


- 后端入口：`backend/app.py`
```bash
uv run -m backend.app
```
- 前端入口：`frontend/package.json`
```bash
cd frontend
pnpm install
pnpm run dev
```
- 项目基础训练脚本：`main/run.py`
```bash
uv run -m main.run
```
- 操作文档与详细说明：请查阅 `main/docs/` 目录

## 主要特性

- 基于 FastAPI，支持高性能异步 API
- Pydantic 强类型数据校验
- 现代化模块分层，易于维护与扩展
- 支持 OpenAPI 3.1 文档自动生成
- 详尽的操作与研究文档已迁移至 `main/docs/`

## 贡献与定制

欢迎二次开发、定制与贡献！详细开发说明与接口文档请参见 `main/docs/`。
