"""
FastAPI路由模块，将API路由与主应用分离
"""

from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, HTTPException, Depends, Query, Request, Body
from fastapi.responses import Response as FastAPIResponse

# 导入模型
from backend.models import (
    # Pydantic 模型
    InitializeResponse,
    QuestionListResponse,
    GenerateSQLResponse,
    DataFrameResponse,
    PlotlyFigureResponse,
    TextResponse,
    RemoveTrainingDataRequest,
    TrainRequest,
    # 数据库会话 - 暂时先不用 TODO：所有程序和本地的缓存方案没有问题后，进行数据库层面的迁移
    get_db_session,
)

from main.run import vn
from backend.cache import MemoryCache
from main.run import initialize_training, train_qa_data
import logging

# 初始化缓存和路由
cache = MemoryCache()
router = APIRouter(prefix="/api/v0", tags=["ChartBI API"])

logger = logging.getLogger("uvicorn")


# 依赖注入函数
def require_cache(fields: List[str], optional_fields: List[str] = None):
    """
    依赖注入函数，用于从缓存中获取必需和可选字段

    参数:
        fields: 必需字段列表，缓存中必须存在这些字段
        optional_fields: 可选字段列表，尝试获取但不强制要求存在

    返回:
        包含所有请求字段的字典，可选字段如果不存在则为None
    """
    optional_fields = optional_fields or []

    def dependency(request: Request):
        # 获取请求ID参数
        id = request.query_params.get("id")
        logger.info(
            f"🚀 请求加载ID: {id}, 路径: {request.url.path}, 必需字段: {fields}, 可选字段: {optional_fields}"
        )

        # 校验ID参数
        if not id:
            raise HTTPException(status_code=400, detail="未提供ID参数")

        # 检查缓存中是否存在该ID
        if id not in cache.cache:
            logger.error(f"❌ 缓存中不存在ID: {id}")
            raise HTTPException(status_code=400, detail=f"缓存中不存在ID: {id}")

        logger.info(f"✅ 缓存中存在数据: {cache.cache[id]}")

        # 检查每个必需字段
        missing_fields = []
        for field in fields:
            value = cache.get(id=id, field=field)
            if value is None:
                missing_fields.append(field)

        # 如果有缺失字段，返回详细错误信息
        if missing_fields:
            error_msg = f"缓存ID {id} 缺少必需字段: {', '.join(missing_fields)}"
            logger.error(f"❌ {error_msg}")
            raise HTTPException(status_code=400, detail=error_msg)

        # 构建结果字典
        result = {"id": id}

        # 添加所有必需字段
        for field in fields:
            result[field] = cache.get(id=id, field=field)

        # 添加所有可选字段（如果存在）
        for field in optional_fields:
            result[field] = cache.get(id=id, field=field)  # 可能为None

        return result

    return Depends(dependency)


# 模型定义已迁移到 backend/models/schemas.py


@router.get("/initialize", response_model=InitializeResponse, summary="初始化训练")
async def initialize():
    initialize_training()
    train_qa_data()
    return {"type": "initialize", "message": "初始化完成"}


# 路由定义
@router.get(
    "/generate_questions", response_model=QuestionListResponse, summary="生成问题列表"
)
async def generate_questions():
    """
    生成一系列可以提问的自然语言问题
    """
    return {
        "type": "question_list",
        "questions": vn.generate_questions(),
        "header": "Here are some questions you can ask:",
    }


@router.get("/generate_sql", response_model=GenerateSQLResponse, summary="生成SQL查询")
async def generate_sql(question: str = Query(..., description="自然语言问题")):
    """
    根据自然语言问题生成SQL查询
    """
    id = cache.generate_id(question=question)
    sql = vn.generate_sql(question=question)
    cache.set(id=id, field="question", value=question)
    cache.set(id=id, field="sql", value=sql)
    return {"type": "sql", "id": id, "text": sql}


@router.get("/run_sql", response_model=DataFrameResponse, summary="执行SQL查询")
async def run_sql(data: Dict[str, Any] = require_cache(fields=["sql"])):
    """
    执行生成的SQL查询并返回结果
    """
    id = data["id"]
    sql = data["sql"]
    try:
        df = vn.run_sql(sql=sql)
        cache.set(id=id, field="df", value=df)
        return {"type": "df", "id": id, "df": df.head(10).to_json(orient="records")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/download_csv", summary="下载CSV文件")
async def download_csv(data: Dict[str, Any] = require_cache(fields=["df"])):
    """
    将数据框导出为CSV文件并下载
    """
    id = data["id"]
    df = data["df"]
    csv = df.to_csv()
    return FastAPIResponse(
        content=csv,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={id}.csv"},
    )


@router.get(
    "/generate_plotly_figure",
    response_model=PlotlyFigureResponse,
    summary="生成Plotly可视化",
)
async def generate_plotly_figure(
    data: Dict[str, Any] = require_cache(fields=["df", "question", "sql"])
):
    """
    根据数据生成Plotly可视化图表
    """
    id = data["id"]
    df = data["df"]
    question = data["question"]
    sql = data["sql"]
    try:
        code = vn.generate_plotly_code(
            question=question,
            sql=sql,
            df_metadata=f"Running df.dtypes gives:\n {df.dtypes}",
        )
        fig = vn.get_plotly_figure(plotly_code=code, df=df, dark_mode=False)
        fig_json = fig.to_json()
        cache.set(id=id, field="fig_json", value=fig_json)
        return {"type": "plotly_figure", "id": id, "fig": fig_json}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate_summary", response_model=TextResponse, summary="生成数据摘要")
async def generate_summary(
    data: Dict[str, Any] = require_cache(
        fields=["df", "question"], optional_fields=["sql"]
    )
):
    """
    根据问题和数据生成摘要信息
    """
    id = data["id"]
    df = data["df"]
    question = data["question"]

    try:
        # 检查是否允许LLM查看数据
        # 注意：这里假设vn对象有allow_llm_to_see_data属性，如果没有需要调整
        if hasattr(vn, "allow_llm_to_see_data") and vn.allow_llm_to_see_data:
            summary = vn.generate_summary(question=question, df=df)
            cache.set(id=id, field="summary", value=summary)

            return {
                "type": "text",
                "id": id,
                "text": summary,
            }
        else:
            return {
                "type": "text",
                "id": id,
                "text": "摘要功能需要设置allow_llm_to_see_data=True才能启用",
            }
    except Exception as e:
        logger.error(f"❌ 生成摘要失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/get_training_data", response_model=DataFrameResponse, summary="获取训练数据"
)
async def get_training_data():
    """
    获取当前的训练数据
    """
    df = vn.get_training_data()
    return {
        "type": "df",
        "id": "training_data",
        "df": df.head(25).to_json(orient="records"),
    }


@router.post("/remove_training_data", summary="删除训练数据")
async def remove_training_data(req: RemoveTrainingDataRequest):
    """
    删除指定ID的训练数据
    """
    if vn.remove_training_data(id=req.id):
        return {"success": True}
    raise HTTPException(status_code=400, detail="Couldn't remove training data")


@router.post("/train", summary="添加训练数据")
async def add_training_data(req: TrainRequest):
    """
    添加新的训练数据
    """
    try:
        id = vn.train(
            question=req.question,
            sql=req.sql,
            ddl=req.ddl,
            documentation=req.documentation,
        )
        return {"id": id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/generate_followup_questions",
    response_model=QuestionListResponse,
    summary="生成后续问题",
)
async def generate_followup_questions(
    data: Dict[str, Any] = require_cache(fields=["df", "question", "sql"])
):
    """
    根据当前问题和数据生成后续问题
    """

    id = data["id"]
    df = data["df"]
    question = data["question"]
    sql = data["sql"]
    followup_questions = vn.generate_followup_questions(
        question=question, sql=sql, df=df
    )
    cache.set(id=id, field="followup_questions", value=followup_questions)
    return {
        "type": "question_list",
        "id": id,
        "questions": followup_questions,
        "header": "Here are some followup questions you can ask:",
    }


@router.get("/load_question", summary="加载已存问题")
async def load_question(
    data: Dict[str, Any] = require_cache(
        fields=["question", "sql", "df"], optional_fields=["summary", "fig_json"]
    )
):
    """
    加载已缓存的问题及其相关数据
    """
    try:
        id = data["id"]
        question = data["question"]
        sql = data["sql"]
        df = data["df"]
        fig_json = data["fig_json"]
        summary = data["summary"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "type": "question_cache",
        "id": id,
        "question": question,
        "sql": sql,
        "df": df.head(10).to_json(orient="records"),
        "fig": fig_json,
        "summary": summary,
    }


@router.get("/get_question_history", summary="获取问题历史")
async def get_question_history():
    """
    获取历史问题列表
    """
    return {
        "type": "question_history",
        "questions": cache.get_all(field_list=["question"]),
    }
