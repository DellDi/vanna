"""
问题记录相关路由模块 - 包含问题生成、SQL执行、数据可视化等功能
"""
import logging
import pandas as pd
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from backend.auth import require_auth
from backend.cache import cache
from backend.utils.cache_utils import require_cache
from backend.models import (
    QuestionListResponse,
    GenerateSQLResponse,
    DataFrameResponse,
    PlotlyFigureResponse,
    QuestionCacheResponse,
    UpdateSQLRequest,
    DeleteQuestionRequest,
    DeleteResponse,
)

# 创建路由
router = APIRouter(tags=["问题记录"])

# 日志配置
logger = logging.getLogger(__name__)

# 导入Vanna实例
try:
    from backend.app import vn
except ImportError:
    logger.error("❌ 无法导入Vanna实例，请确保应用已正确初始化")
    vn = None


# 使用公共缓存工具模块中的 RequireCache 类和 require_cache 函数


@router.post("/generate_sql", response_model=GenerateSQLResponse, summary="生成SQL")
async def generate_sql(question: str = Query(..., description="用户问题"), user: Any = Depends(require_auth)):
    """
    根据自然语言问题生成SQL查询
    
    接收用户的自然语言问题，使用大语言模型生成对应的SQL查询语句。
    """
    try:
        if not question or not question.strip():
            logger.error("❌ 未提供有效问题")
            raise HTTPException(status_code=400, detail="未提供有效问题")
        
        # 生成唯一ID
        id = cache.generate_id()
        
        # 生成SQL
        sql = vn.generate_sql(question)
        
        # 缓存问题和SQL
        cache.set(id=id, field="question", value=question)
        cache.set(id=id, field="sql", value=sql)
        
        logger.info(f"✅ 已为问题生成SQL, ID: {id}")
        
        return {
            "type": "sql",
            "id": id,
            "question": question,
            "sql": sql
        }
    except Exception as e:
        logger.error(f"❌ 生成SQL失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
        
        return {
            "type": "sql",
            "id": id,
            "question": question,
            "sql": sql
        }
    except Exception as e:
        logger.error(f"❌ 更新SQL失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/run_sql", response_model=DataFrameResponse, summary="执行SQL")
async def run_sql(data: Dict[str, Any] = require_cache(fields=["sql"])):
    """
    执行SQL查询并返回结果
    
    执行缓存中的SQL查询，返回查询结果数据框。
    """
    try:
        id = data["id"]
        sql = data["sql"]
        
        # 执行SQL
        df = vn.run_sql(sql)
        
        # 缓存结果
        cache.set(id=id, field="df", value=df)
        
        logger.info(f"✅ 已执行SQL, ID: {id}, 结果行数: {len(df)}")
        
        return {
            "type": "dataframe",
            "id": id,
            "df": df.head(10).to_json(orient="records"),
            "should_generate_chart": True
        }
    except Exception as e:
        logger.error(f"❌ 执行SQL失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
        headers = {
            'Content-Disposition': f'attachment; filename="{id}.csv"'
        }
        
        logger.info(f"✅ 已生成CSV下载, ID: {id}")
        
        return Response(content=csv, media_type="text/csv", headers=headers)
    except Exception as e:
        logger.error(f"❌ 生成CSV下载失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate_plotly_figure", response_model=PlotlyFigureResponse, summary="生成图表")
async def generate_plotly_figure(data: Dict[str, Any] = require_cache(fields=["df", "question", "sql"])):
    """
    生成Plotly可视化图表
    
    根据查询结果生成适合的Plotly可视化图表。
    """
    try:
        id = data["id"]
        df = data["df"]
        question = data["question"]
        sql = data["sql"]
        
        # 生成图表
        fig = vn.get_plotly_figure(question=question, sql=sql, df=df)
        fig_json = fig.to_json()
        
        # 缓存图表
        cache.set(id=id, field="fig_json", value=fig_json)
        
        logger.info(f"✅ 已生成图表, ID: {id}")
        
        return {
            "type": "plotly_figure",
            "id": id,
            "fig": fig_json
        }
    except Exception as e:
        logger.error(f"❌ 生成图表失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate_followup_questions", response_model=QuestionListResponse, summary="生成后续问题")
async def generate_followup_questions(data: Dict[str, Any] = require_cache(fields=["df", "question", "sql"])):
    """
    根据当前问题和数据生成后续问题
    """
    try:
        id = data["id"]
        df = data["df"]
        question = data["question"]
        sql = data["sql"]
        
        # 生成后续问题
        followup_questions = vn.generate_followup_questions(question=question, sql=sql, df=df)
        
        # 缓存后续问题
        cache.set(id=id, field="followup_questions", value=followup_questions)
        
        logger.info(f"✅ 已生成后续问题, ID: {id}, 问题数量: {len(followup_questions)}")
        
        return {
            "type": "question_list",
            "id": id,
            "questions": followup_questions,
            "header": "以下是您可能感兴趣的后续问题："
        }
    except Exception as e:
        logger.error(f"❌ 生成后续问题失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/load_question", response_model=QuestionCacheResponse, summary="加载问题")
async def load_question(data: Dict[str, Any] = require_cache(
    fields=["question", "sql", "df"], 
    optional_fields=["fig_json", "followup_questions", "summary"]
)):
    """
    加载已缓存的问题及其相关数据
    """
    try:
        id = data["id"]
        question = data["question"]
        sql = data["sql"]
        df = data["df"]
        fig_json = data.get("fig_json")
        followup_questions = data.get("followup_questions", [])
        summary = data.get("summary", "")
        
        logger.info(f"✅ 已加载问题, ID: {id}")
        
        return {
            "type": "question_cache",
            "id": id,
            "question": question,
            "sql": sql,
            "df": df.head(10).to_json(orient="records"),
            "fig": fig_json,
            "followup_questions": followup_questions,
            "summary": summary
        }
    except Exception as e:
        logger.error(f"❌ 加载问题失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/delete_question", response_model=DeleteResponse, summary="删除问题记录")
async def delete_question(request: DeleteQuestionRequest, user: Any = Depends(require_auth)):
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
