"""
拓展能力相关路由模块 - 包含数据摘要、问题重写等拓展功能
"""
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request

from main.run import vn
from backend.auth import require_auth
from backend.cache import cache
from backend.utils.cache_utils import require_cache
from backend.models import (
    TextResponse,
    RewrittenQuestionResponse,
    PlotlyFigureResponse,
)

# 创建路由
router = APIRouter(tags=["功能拓展"])

# 日志配置
logger = logging.getLogger(__name__)


# 使用公共缓存工具模块中的 RequireCache 类和 require_cache 函数


@router.get("/download_csv", summary="下载CSV")
async def download_csv(data: Dict[str, Any] = require_cache(fields=["df"])):
    """
    下载查询结果为CSV文件

    将缓存中的查询结果导出为CSV文件供下载。
    """
    try:
        id = data["id"]
        df = data["df"]

        # 转换为CSV
        csv = df.to_csv(index=False)

        # 设置响应头
        headers = {"Content-Disposition": f'attachment; filename="{id}.csv"'}

        logger.info(f"✅ 已生成CSV下载, ID: {id}")

        return Response(content=csv, media_type="text/csv", headers=headers)
    except Exception as e:
        logger.error(f"❌ 生成CSV下载失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/generate_plotly_figure", response_model=PlotlyFigureResponse, summary="生成图表"
)
async def generate_plotly_figure(
    chart_instructions: Optional[str] = Query(None, description="图表生成特殊指令"),
    data: Dict[str, Any] = require_cache(fields=["df", "question", "sql"]),
    user: Any = Depends(require_auth)
):
    """
    生成Plotly可视化图表

    根据查询结果生成适合的Plotly可视化图表。
    可以通过chart_instructions参数提供特殊的图表生成指令。
    """
    try:
        id = data["id"]
        df = data["df"]
        question = data["question"]
        sql = data["sql"]

        logger.info(f"✅ 开始生成图表, ID: {id}, 指令: {chart_instructions if chart_instructions else '无'}")
        logger.info(f"✅ 开始生成图表, df: {df}")
        logger.info(f"✅ 开始生成图表, question: {question}")
        logger.info(f"✅ 开始生成图表, sql: {sql}")
        # 如果没有chart_instructions，尝试从缓存获取plotly代码
        if chart_instructions is None or len(chart_instructions.strip()) == 0:
            code = cache.get(id=id, field="plotly_code")
            logger.info(f"✅ 从缓存获取plotly代码: {'成功' if code else '失败'}")
        else:
            # 如果有chart_instructions，生成新的plotly代码
            enhanced_question = f"{question}. When generating the chart, use these special instructions: {chart_instructions}"
            code = vn.generate_plotly_code(
                question=enhanced_question,
                sql=sql,
                df=df,
                chart_instructions=chart_instructions
            )
            # 缓存plotly代码
            cache.set(id=id, field="plotly_code", value=code)
            logger.info(f"✅ 生成并缓存了新的plotly代码")

        # 生成图表
        fig = vn.get_plotly_figure(plotly_code=code, df=df, dark_mode=False)
        fig_json = fig.to_json()

        # 缓存图表JSON
        cache.set(id=id, field="fig_json", value=fig_json)

        logger.info(f"✅ 已生成图表并缓存, ID: {id}")

        return {"type": "plotly_figure", "id": id, "fig": fig_json}
    except Exception as e:
        # 打印堆栈跟踪
        import traceback
        logger.error(f"❌ 生成图表失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate_summary", response_model=TextResponse, summary="生成数据摘要")
async def generate_summary(data: Dict[str, Any] = require_cache(fields=["df", "question", "sql"])):
    """
    生成数据摘要

    根据查询结果生成自然语言摘要，帮助用户理解数据含义。
    """
    try:
        id = data["id"]
        df = data["df"]
        question = data["question"]
        sql = data["sql"]

        # 获取配置
        from backend.routes.base import config
        allow_llm_to_see_data = config.get("features", {}).get("allow_llm_to_see_data", True)

        # 生成摘要
        if allow_llm_to_see_data:
            summary = vn.generate_summary(question=question, sql=sql, df=df)
        else:
            summary = vn.generate_summary(question=question, sql=sql)

        # 缓存摘要
        cache.set(id=id, field="summary", value=summary)

        logger.info(f"✅ 已生成数据摘要, ID: {id}")

        return {
            "type": "text",
            "text": summary
        }
    except Exception as e:
        logger.error(f"❌ 生成数据摘要失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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


# @router.get("/generate_questions", response_model=TextResponse, summary="生成问题建议")
# async def generate_questions(user: Any = Depends(require_auth)):
#     """
#     生成问题建议

#     根据系统中的数据生成可能的问题建议，帮助用户开始数据探索。
#     """
#     try:
#         # 生成问题建议
#         questions = vn.generate_questions()

#         logger.info(f"✅ 已生成问题建议，共 {len(questions)} 条")

#         return {
#             "type": "text",
#             "text": "\n".join([f"- {q}" for q in questions])
#         }
#     except Exception as e:
#         logger.error(f"❌ 生成问题建议失败: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))
