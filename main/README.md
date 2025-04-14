# 简介

一个基于 Qwen 的智能体，用于自然语言转 SQL（NL2SQL）任务。

## 系统架构

[系统架构](docs/nl2sql-research-report.md)

## 技术方案

[技术方案](docs/nl2sql-research-report.md)

## 启动说明

### 环境变量

```bash
cp .env.template .env
```

### 安装依赖

```bash
cd vanna/main
uv venv
source .venv/bin/activate
uv pip install 'vanna[chromadb,openai,mysql]'
```

### 启动

```bash
cd vanna/main
uv run -m run
```