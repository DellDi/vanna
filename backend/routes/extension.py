"""
拓展能力相关路由模块 - 包含数据摘要、问题重写等拓展功能
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel

from backend.auth import require_auth
from backend.cache import cache
from backend.utils.cache_utils import require_cache
from backend.models import (
    TextResponse,
    RewrittenQuestionResponse,
)

# 创建路由
router = APIRouter(tags=["拓展能力"])

# 日志配置
logger = logging.getLogger(__name__)

# 导入Vanna实例
try:
    from backend.app import vn
except ImportError:
    logger.error("❌ 无法导入Vanna实例，请确保应用已正确初始化")
    vn = None


# 使用公共缓存工具模块中的 RequireCache 类和 require_cache 函数

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


@router.get("/generate_questions", response_model=TextResponse, summary="生成问题建议")
async def generate_questions(user: Any = Depends(require_auth)):
    """
    生成问题建议
    
    根据系统中的数据生成可能的问题建议，帮助用户开始数据探索。
    """
    try:
        # 生成问题建议
        questions = vn.generate_questions()
        
        logger.info(f"✅ 已生成问题建议，共 {len(questions)} 条")
        
        return {
            "type": "text",
            "text": "\n".join([f"- {q}" for q in questions])
        }
    except Exception as e:
        logger.error(f"❌ 生成问题建议失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
