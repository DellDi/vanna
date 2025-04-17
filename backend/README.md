# ChartBI API 后端服务

## 项目概述

ChartBI API 是一个基于 FastAPI 构建的自然语言到 SQL 查询转换服务，支持数据可视化和智能问答功能。本服务利用大语言模型将自然语言问题转换为 SQL 查询，执行查询并返回结果，同时提供数据可视化和相关问题推荐。

## 技术栈

- **Python 3.11+**
- **FastAPI**: 高性能异步 API 框架
- **Uvicorn**: ASGI 服务器
- **Pydantic**: 数据验证和设置管理
- **Vanna**: 自然语言到 SQL 转换引擎
- **Plotly**: 数据可视化
- **ChromaDB**: 向量存储

## 项目结构

```
backend/
├── __init__.py        # 包初始化文件
├── app.py             # FastAPI 应用主入口
├── routes.py          # API 路由定义
├── cache.py           # 缓存实现
└── README.md          # 项目文档
```

## 核心功能

### 1. 自然语言转 SQL

将自然语言问题转换为可执行的 SQL 查询语句。

```python
# 示例请求
GET /api/v0/generate_sql?question=查询最近一个月的销售数据
```

### 2. SQL 执行

执行生成的 SQL 查询并返回结果。

```python
# 示例请求
GET /api/v0/run_sql?id=<query_id>
```

### 3. 数据可视化

基于查询结果生成可视化图表。

```python
# 示例请求
GET /api/v0/generate_plotly_figure?id=<query_id>
```

### 4. 问题推荐

生成相关问题建议，帮助用户进一步探索数据。

```python
# 示例请求
GET /api/v0/generate_questions
GET /api/v0/generate_followup_questions?id=<query_id>
```

### 5. 模型训练

支持添加自定义训练数据，优化模型性能。

```python
# 示例请求
POST /api/v0/train
```

## 缓存系统

服务使用内存缓存系统存储查询结果和生成的图表，支持以下操作：

- 生成唯一 ID
- 设置缓存值
- 获取缓存值
- 获取所有缓存项
- 删除缓存项

## API 文档

完整的 API 文档可通过以下方式访问：

- Swagger UI: `/docs`
- ReDoc: `/redoc`
- OpenAPI JSON: `/openapi.json`

## 启动服务

```bash
# 安装依赖
uv pip install -e .

# 安装可选依赖 - mysql, chromadb, openai
uv pip install 'vanna[mysql,chromadb,openai]'

# 启动服务
uv run -m backend.app
```

## 环境变量

服务需要以下环境变量（参考 `.env.template`）：

### MySQL 数据库连接

- `MYSQL_HOST`: MySQL 数据库主机地址
- `MYSQL_USER`: MySQL 用户名
- `MYSQL_PASSWORD`: MySQL 密码
- `MYSQL_PORT`: MySQL 端口
- `MYSQL_DB`: MySQL 数据库名

### 千问模型配置

- `QWEN_KEY`: 千问 API 密钥
- `QWEN_MODEL`: 千问模型名称，默认为 `qwen-max-latest`
- `QWEN_BASE_URL`: 千问 API 基础地址，默认为 `https://dashscope.aliyuncs.com/compatible-mode/v1`

## 扩展与定制

服务设计为模块化架构，可以通过以下方式扩展：

1. 添加新的路由到 `routes.py`
2. 实现自定义缓存系统（继承 `Cache` 抽象类）
3. 集成其他数据库连接器
4. 自定义数据可视化生成逻辑