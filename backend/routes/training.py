"""
训练相关路由模块 - 包含模型训练、训练数据管理等功能
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel

from backend.auth import require_auth
from backend.cache import cache
from backend.models import (
    TrainRequest,
    RemoveTrainingDataRequest,
    BaseResponse,
)

# 创建路由
router = APIRouter(tags=["训练"])

# 日志配置
logger = logging.getLogger(__name__)

# 导入Vanna实例
try:
    from backend.app import vn
except ImportError:
    logger.error("❌ 无法导入Vanna实例，请确保应用已正确初始化")
    vn = None


@router.post("/train", summary="添加训练数据")
async def train(request: TrainRequest, user: Any = Depends(require_auth)):
    """
    添加训练数据
    
    添加自定义训练数据，用于优化模型生成SQL的能力。
    可以提供问题、SQL、DDL和文档说明。
    """
    try:
        # 获取训练数据
        question = request.question
        sql = request.sql
        ddl = request.ddl or ""
        documentation = request.documentation or ""
        
        # 验证必要参数
        if not question or not question.strip():
            logger.error("❌ 未提供有效问题")
            raise HTTPException(status_code=400, detail="未提供有效问题")
            
        if not sql or not sql.strip():
            logger.error("❌ 未提供有效SQL")
            raise HTTPException(status_code=400, detail="未提供有效SQL")
        
        # 添加训练数据
        vn.train(question=question, sql=sql, ddl=ddl, documentation=documentation)
        
        logger.info(f"✅ 已添加训练数据: {question}")
        
        return {
            "type": "train",
            "message": "训练数据添加成功"
        }
    except Exception as e:
        logger.error(f"❌ 添加训练数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/remove_training_data", summary="删除训练数据")
async def remove_training_data(request: RemoveTrainingDataRequest, user: Any = Depends(require_auth)):
    """
    删除训练数据
    
    根据问题或SQL删除对应的训练数据。
    """
    try:
        # 获取参数
        question = request.question
        sql = request.sql
        
        # 验证参数
        if not question and not sql:
            logger.error("❌ 未提供问题或SQL")
            raise HTTPException(status_code=400, detail="必须提供问题或SQL中的至少一项")
        
        # 删除训练数据
        if question:
            vn.remove_training_data(question=question)
            logger.info(f"✅ 已删除问题对应的训练数据: {question}")
        elif sql:
            vn.remove_training_data(sql=sql)
            logger.info(f"✅ 已删除SQL对应的训练数据: {sql[:50]}...")
        
        return {
            "type": "remove_training_data",
            "message": "训练数据删除成功"
        }
    except Exception as e:
        logger.error(f"❌ 删除训练数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/get_training_data", summary="获取训练数据")
async def get_training_data(user: Any = Depends(require_auth)):
    """
    获取所有训练数据
    
    返回系统中所有的训练数据，包括问题、SQL、DDL和文档说明。
    """
    try:
        # 获取训练数据
        training_data = vn.get_training_data()
        
        logger.info(f"✅ 已获取训练数据，共 {len(training_data)} 条")
        
        return {
            "type": "training_data",
            "training_data": training_data
        }
    except Exception as e:
        logger.error(f"❌ 获取训练数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
