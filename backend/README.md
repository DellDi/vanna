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
├── models/            # 模型定义目录
│   ├── __init__.py    # 模型包初始化
│   ├── schemas.py     # API请求/响应模型(Pydantic)
│   ├── database.py    # 数据库ORM模型(SQLAlchemy)
│   ├── database_config.py # 数据库配置
│   ├── repositories.py # 数据库仓库
│   └── init_db.py     # 数据库初始化脚本
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

## 数据库模型设计

项目采用了分层设计，包含以下两类模型：

### 1. API模型 (Pydantic)

使用Pydantic模型进行请求/响应验证，主要包含：

- `BaseResponse`: 所有响应的基础模型
- `InitializeResponse`: 初始化响应
- `QuestionListResponse`: 问题列表响应
- `GenerateSQLResponse`: SQL生成响应
- `DataFrameResponse`: 数据框响应
- `PlotlyFigureResponse`: 图表响应
- `TextResponse`: 文本响应
- `RemoveTrainingDataRequest`: 删除训练数据请求
- `TrainRequest`: 添加训练数据请求

### 2. 数据库模型 (SQLAlchemy ORM)

使用SQLAlchemy ORM定义数据库模型，支持PostgreSQL数据库：

```mermaid
classDiagram
   Question "1" -- "1" SQLQuery : has
   Question "1" -- "1" DataFrame : has
   Question "1" -- "1" PlotlyFigure : has
   Question "1" -- "1" Summary : has
   Question "1" -- "*" FollowupQuestion : has
   class Question {
       +id: String
       +text: String
       +created_at: DateTime
       +updated_at: DateTime
   }
   class SQLQuery {
       +id: String
       +question_id: String
       +text: String
       +created_at: DateTime
   }
   class DataFrame {
       +id: String
       +question_id: String
       +data: JSON
       +created_at: DateTime
   }
   class PlotlyFigure {
       +id: String
       +question_id: String
       +figure_json: JSON
       +created_at: DateTime
   }
   class Summary {
       +id: String
       +question_id: String
       +text: String
       +created_at: DateTime
   }
   class FollowupQuestion {
       +id: String
       +question_id: String
       +text: String
       +order: Integer
       +created_at: DateTime
   }
   class TrainingData {
       +id: String
       +question: String
       +sql: String
       +ddl: String
       +documentation: String
       +created_at: DateTime
       +updated_at: DateTime
   }
```

### 3. 仓库模式 (Repository Pattern)

采用仓库模式封装数据库操作，提供高级API接口：

- `QuestionRepository`: 问题仓库
- `SQLQueryRepository`: SQL查询仓库
- `DataFrameRepository`: 数据框仓库
- `PlotlyFigureRepository`: 图表仓库
- `SummaryRepository`: 摘要仓库
- `FollowupQuestionRepository`: 后续问题仓库
- `TrainingDataRepository`: 训练数据仓库

## 数据库配置

项目支持多种数据库配置：

### 1. 开发环境（SQLite）

默认使用SQLite数据库，无需额外配置。

### 2. 生产环境（PostgreSQL）

通过环境变量配置数据库连接：

```bash
# PostgreSQL连接示例
DATABASE_URL=postgresql://username:password@localhost:5432/chartbi
```

### 3. 初始化数据库

```bash
# 初始化数据库表
python -m backend.models.init_db
```

## 启动服务

```bash
# 安装依赖
uv pip install -e .
# 注意window，需要安装Microsoft C++ Build Tools
https://visualstudio.microsoft.com/visual-cpp-build-tools/
# 安装可选依赖 - mysql, chromadb, openai, postgres
uv pip install 'vanna[chromadb,openai,mysql,postgres]'
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