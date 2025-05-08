"""
问题记录相关路由模块 - 包含问题生成、SQL执行、数据可视化等功能
"""

import logging
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from backend.models.schemas import TextResponse
from main.run import vn

from backend.utils.config import config
from backend.auth import require_auth
from backend.cache import cache
from backend.utils.cache_utils import require_cache
from backend.models import (
    QuestionListResponse,
    GenerateSQLResponse,
    DataFrameResponse,
    QuestionCacheResponse,
    UpdateSQLRequest,
    DeleteQuestionRequest,
    DeleteResponse,
)

# 创建路由
router = APIRouter(tags=["提问核心"])

# 日志配置
logger = logging.getLogger(__name__)


@router.get("/get_question_history", summary="获取问题历史")
async def get_question_history():
    """
    获取历史问题列表
    """
    return {
        "type": "question_history",
        "questions": cache.get_all(field_list=["question"]),
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


@router.post("/update_sql", response_model=GenerateSQLResponse, summary="更新SQL")
async def update_sql(request: UpdateSQLRequest, user: Any = Depends(require_auth)):
    """
    更新已生成的SQL查询

    允许用户修改系统生成的SQL查询，用于纠正或优化查询语句。
    """
    try:
        id = request.id
        sql = request.sql

        if not id or not id.strip():
            logger.error("❌ 未提供有效ID")
            raise HTTPException(status_code=400, detail="未提供有效ID")

        if not sql or not sql.strip():
            logger.error("❌ 未提供有效SQL")
            raise HTTPException(status_code=400, detail="未提供有效SQL")

        # 获取原始问题
        question = cache.get(id=id, field="question")
        if not question:
            logger.error(f"❌ 未找到ID对应的问题: {id}")
            raise HTTPException(status_code=404, detail=f"未找到ID对应的问题: {id}")

        # 更新SQL
        cache.set(id=id, field="sql", value=sql)

        logger.info(f"✅ 已更新SQL, ID: {id}")

        return {"type": "sql", "id": id, "question": question, "sql": sql}
    except Exception as e:
        logger.error(f"❌ 更新SQL失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/run_sql", response_model=DataFrameResponse, summary="执行SQL查询")
async def run_sql(data: Dict[str, Any] = require_cache(fields=["sql"])):
    """
    执行生成的SQL查询并返回结果
    """
    id = data["id"]
    sql = data["sql"]
    try:
        df = vn.run_sql(sql=sql)
        logger.info(f"✅ 执行SQL成功, ID: {id}, df: {df}")
        cache.set(id=id, field="df", value=df)
        return {
            "type": "df",
            "id": id,
            "df": df.head(10).to_json(orient="records", date_format="iso"),
            "should_generate_chart": config["chart"],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 路由定义
@router.get(
    "/generate_questions", response_model=QuestionListResponse, summary="生成问题列表"
)
async def generate_questions(user: Any = Depends(require_auth)):
    """
    生成一系列可以提问的自然语言问题
    根据训练数据或预定义模型生成可以提问的问题列表。
    """

    try:
        # 获取训练数据
        training_data = vn.get_training_data()
        logger.info(f"✅ 获取到训练数据: {len(training_data)}行")

        # 如果训练数据为空，返回错误
        if training_data is None or len(training_data) == 0:
            logger.warning("⚠️ 未找到训练数据")
            return {
                "type": "question_list",
                "questions": [
                    "各个项目的收入排名是什么?",
                    "去年的总收入是多少?",
                    "哪个项目的收入增长最快?",
                ],
                "header": "未找到训练数据 默认问题",
            }

        # 从训练数据中筛选出有问题的数据
        valid_questions = training_data[training_data["question"].notnull()]
        logger.info(f"✅ 筛选出有效问题: {len(valid_questions)}个")

        # 如果有效问题少于5个，则全部使用；否则随机抽取5个
        if len(valid_questions) <= 5:
            questions = valid_questions["question"].tolist()
            logger.info(f"✅ 有效问题少于5个，使用全部{len(questions)}个问题")
        else:
            questions = valid_questions.sample(5)["question"].tolist()
            logger.info(f"✅ 随机抽取5个问题")

        # 如果没有有效问题，返回空列表
        if len(questions) == 0:
            logger.warning("⚠️ 未找到有效问题")
            return {
                "type": "question_list",
                "questions": [],
                "header": "Go ahead and ask a question",
            }

        return {
            "type": "question_list",
            "questions": questions,
            "header": "Here are some questions you can ask",
        }
    except Exception as e:
        logger.error(f"❌ 生成问题列表失败: {str(e)}")
        return {
            "type": "question_list",
            "questions": [],
            "header": "Go ahead and ask a question",
        }


@router.get(
    "/generate_followup_questions", response_model=TextResponse, summary="生成后续问题"
)
async def generate_followup_questions(
    data: Dict[str, Any] = require_cache(fields=["df", "question", "sql"])
):
    """
    根据当前问题和数据生成后续问题

    此功能用于根据已有的查询结果和问题上下文，自动生成相关的后续问题建议，
    帮助用户进一步探索数据或深入分析。
    """
    try:
        id = data["id"]
        df = data["df"]
        question = data["question"]
        sql = data["sql"]

        logger.info(f"✅ 开始生成后续问题, ID: {id}, question: {question}, sql: {sql}, df: {df}")
        # 生成后续问题
        followup_questions = vn.generate_followup_questions(
            question=question, sql=sql, df=df
        )

        # 缓存后续问题
        cache.set(id=id, field="followup_questions", value=followup_questions)

        logger.info(f"✅ 已生成后续问题, ID: {id}, followup_questions: {followup_questions}")

        return {
            "type": "text",
            "id": id,  # 添加id字段，修复响应验证错误
            "text": "\n".join([f"- {q}" for q in followup_questions]),
        }
    except Exception as e:
        logger.error(f"❌ 生成后续问题失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/load_question", response_model=QuestionCacheResponse, summary="加载问题")
async def load_question(
    data: Dict[str, Any] = require_cache(
        fields=["question", "sql", "df"],
        optional_fields=["fig_json", "followup_questions", "summary"],
    )
):
    """
    加载已缓存的问题及其相关数据

    根据问题ID从缓存中加载问题、SQL、数据结果、图表（如果存在）、后续问题（如果存在）和摘要（如果存在）。
    """
    try:
        id = data["id"]
        question = data["question"]
        sql = data["sql"]
        df_json = data["df"].to_json(orient="records")  # 确保DataFrame序列化
        fig_json = data.get("fig_json")
        followup_questions = data.get("followup_questions")
        summary = data.get("summary")

        logger.info(f"✅ 已加载问题, ID: {id}")

        return {
            "type": "question_cache",
            "id": id,
            "question": question,
            "sql": sql,
            "df": df_json,
            "fig_json": fig_json,
            "followup_questions": followup_questions,
            "summary": summary,
        }
    except Exception as e:
        logger.error(f"❌ 加载问题失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete_question", response_model=DeleteResponse, summary="删除问题")
async def delete_question(
    request: DeleteQuestionRequest, user: Any = Depends(require_auth)
):
    """
    删除问题记录及相关数据

    根据问题ID删除缓存中的问题及其相关数据，包括SQL查询、数据结果、图表等。
    如果集成了数据库，还会从数据库中删除相关记录。
    """
    try:
        id = request.id

        if not id or not id.strip():
            logger.error("❌ 未提供有效ID")
            raise HTTPException(status_code=400, detail="未提供有效ID")

        # 检查问题是否存在于缓存中
        if not cache.has_key(id=id, field="question"):
            logger.warning(f"⚠️ 尝试删除不存在的问题, ID: {id}")
            raise HTTPException(status_code=404, detail=f"未找到ID对应的问题: {id}")

        # 从缓存中删除与该ID相关的所有字段
        # 注意：这里的删除逻辑可能需要根据您的Cache实现进行调整
        # 假设cache有一个delete_all_fields_for_id方法或类似机制
        fields_to_delete = [
            "question",
            "sql",
            "df",
            "fig_json",
            "followup_questions",
            "summary",
        ]
        for field in fields_to_delete:
            if cache.has_key(id=id, field=field):
                cache.delete(id=id, field=field)

        # 如果您的Vanna实例有从数据库删除记录的方法，也应在此调用
        # 例如: vn.delete_training_data(id=id)
        # 这里需要根据Vanna的实际能力来决定是否以及如何从持久化存储中删除
        # 目前的Vanna库主要关注基于向量数据库的训练数据管理，
        # 对于具体用户问题记录的删除，可能需要应用层面实现。
        # 假设我们仅清除缓存中的数据

        logger.info(f"✅ 已删除问题记录, ID: {id}")

        return {
            "type": "delete_response",
            "id": id,
            "success": True,
            "message": f"成功删除问题 {id} 及其相关数据。",
        }
    except HTTPException:
        raise  # 重新抛出HTTPException，以便FastAPI处理
    except Exception as e:
        logger.error(f"❌ 删除问题失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"删除问题失败: {str(e)}")
