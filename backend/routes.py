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
    ConfigResponse,
    RemoveTrainingDataRequest,
    TrainRequest,
    UpdateSQLRequest,
    RewrittenQuestionResponse,
    DeleteQuestionRequest,
    DeleteResponse,
    # 数据库会话 - 暂时先不用 TODO：所有程序和本地的缓存方案没有问题后，进行数据库层面的迁移
    get_db_session,
)

from main.run import vn
from backend.cache import MemoryCache
from backend.auth import require_auth, auth
from main.run import initialize_training, train_qa_data
import logging
import importlib.metadata

# 初始化缓存和路由
cache = MemoryCache()
router = APIRouter(prefix="/api/v0", tags=["ChartBI API"])

logger = logging.getLogger("uvicorn")

# 全局配置
# 默认配置与原始Flask版本保持一致
config = {
    # 基础配置
    "debug": True,
    "allow_llm_to_see_data": False,
    "chart": True,
    # UI配置
    "logo": "https://poc.new-see.com/M00/00/DB/rBA3xGgJrJyABcs_ABrGg9fghbg128.png",
    "title": "Welcome to ChartBI API",
    "subtitle": "Your AI-powered copilot for SQL queries.",
    # 功能开关
    "show_training_data": True,
    "suggested_questions": True,
    "sql": True,
    "table": True,
    "csv_download": True,
    "redraw_chart": True,
    "auto_fix_sql": True,
    "ask_results_correct": True,
    "followup_questions": True,
    "summarization": True,
    "function_generation": hasattr(vn, "get_function"),
    # 版本信息
    "version": "0.2.0",
}


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

@router.get("/generate_rewritten_question", response_model=RewrittenQuestionResponse, summary="生成重写问题")
async def generate_rewritten_question(
    last_question: str = Query(..., description="上一个问题"),
    new_question: str = Query(..., description="新问题"),
    user: Any = Depends(require_auth)
):
    """
    生成重写后的问题

    根据上一个问题和新问题，生成一个重写后的问题。
    这样可以在保持上下文的同时，提高问题的质量。
    """
    try:
        # 检查参数
        if not last_question or not last_question.strip():
            logger.error("❌ 未提供上一个问题")
            raise HTTPException(status_code=400, detail="未提供上一个问题")

        if not new_question or not new_question.strip():
            logger.error("❌ 未提供新问题")
            raise HTTPException(status_code=400, detail="未提供新问题")

        # 生成重写后的问题
        rewritten_question = vn.generate_rewritten_question(last_question, new_question)
        logger.info(f"🔄 已生成重写问题: {rewritten_question}")

        return {
            "type": "rewritten_question",
            "question": rewritten_question
        }
    except Exception as e:
        logger.error(f"❌ 生成重写问题失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get_config", response_model=ConfigResponse, summary="获取配置信息")
async def get_config(user: Any = Depends(require_auth)):
    """
    获取用户配置信息

    返回当前用户的配置信息，包括界面设置和功能开关等。
    如果用户未登录，将返回401错误。
    """
    # 根据用户覆盖配置
    user_config = auth.override_config_for_user(user, config)

    # 更新版本信息
    try:
        version = importlib.metadata.version('vanna')
        user_config["version"] = version
    except importlib.metadata.PackageNotFoundError:
        # 使用默认版本
        pass

    return {
        "type": "config",
        "config": user_config
    }


@router.get("/initialize", response_model=InitializeResponse, summary="初始化训练")
async def initialize():
    initialize_training()
    train_qa_data()
    return {"type": "initialize", "message": "初始化完成"}



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
        return {"type": "df", "id": id, "df": df.head(10).to_json(orient="records"), "should_generate_chart": config["chart"]}
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


@router.post("/update_sql", response_model=GenerateSQLResponse, summary="更新SQL查询")
async def update_sql(req: UpdateSQLRequest, user: Any = Depends(require_auth)):
    """
    更新已存在的SQL查询

    接收查询ID和新的SQL查询文本，更新缓存中的SQL查询。
    返回更新后的SQL查询信息。
    """
    # 检查缓存中是否存在该ID
    if req.id not in cache.cache:
        logger.error(f"❌ 缓存中不存在ID: {req.id}")
        raise HTTPException(status_code=400, detail=f"缓存中不存在ID: {req.id}")

    # 检查SQL查询是否为空
    if not req.sql or not req.sql.strip():
        logger.error("❌ 未提供SQL查询")
        raise HTTPException(status_code=400, detail="未提供SQL查询")

    # 更新缓存中的SQL查询
    cache.set(id=req.id, field="sql", value=req.sql)
    logger.info(f"🔄 已更新SQL查询: ID={req.id}")

    # 返回更新后的SQL查询信息
    return {
        "type": "sql",
        "id": req.id,
        "text": req.sql
    }


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
        "header": "Here are some follow-up questions you might be interested in:"
    }


@router.delete(
    "/delete_question",
    response_model=DeleteResponse,
    summary="删除问题记录"
)
async def delete_question(
    request: DeleteQuestionRequest,
    user: Any = Depends(require_auth)
):
    """
    删除问题记录及相关数据

    根据问题ID删除缓存中的问题及其相关数据，包括SQL查询、数据结果、图表等。
    如果集成了数据库，还会从数据库中删除相关记录。
    """
    try:
        # 获取要删除的问题ID
        question_id = request.id

        if not question_id or not question_id.strip():
            logger.error("❌ 未提供有效的问题ID")
            raise HTTPException(status_code=400, detail="未提供有效的问题ID")

        # 检查问题是否存在
        question = cache.get(id=question_id, field="question")
        if not question:
            logger.warning(f"⚠️ 问题ID {question_id} 不存在")
            return {
                "type": "delete",
                "success": False,
                "message": f"问题ID {question_id} 不存在或已被删除"
            }

        # 删除缓存中的所有相关数据
        cache_fields = [
            "question", "sql", "df", "fig_json", "followup_questions",
            "summary", "chart_type", "chart_title", "chart_description"
        ]

        for field in cache_fields:
            cache.delete(id=question_id, field=field)

        # TODO: 如果集成了数据库，还需要从数据库中删除相关记录
        # 这里将来会使用仓库模式进行数据库操作
        # with get_db_session() as session:
        #     question_repo = QuestionRepository(session)
        #     question_repo.delete(question_id)

        logger.info(f"🗑️ 成功删除问题ID: {question_id}")

        return {
            "type": "delete",
            "success": True,
            "message": f"成功删除问题及相关数据"
        }
    except Exception as e:
        logger.error(f"❌ 删除问题失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
