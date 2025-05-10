"""
训练相关路由模块 - 包含模型训练、训练数据管理等功能
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from main.run import vn
from backend.auth import require_auth
from backend.models import (
    TrainRequest,
    TrainingDataResponse,
    RemoveTrainingDataRequest,
    RemoveTrainingDataResponse,
)

# 创建路由
router = APIRouter(tags=["SQL训练"])

# 日志配置
logger = logging.getLogger(__name__)


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

        return {"type": "train", "message": "训练数据添加成功"}
    except Exception as e:
        logger.error(f"❌ 添加训练数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/remove_training_data", response_model=RemoveTrainingDataResponse, summary="删除训练数据")
async def remove_training_data(
    request: RemoveTrainingDataRequest, user: Any = Depends(require_auth)
):
    """
    删除训练数据

    根据问题或SQL删除对应的训练数据。
    """
    try:
        id = request.id
        logger.info(f"✅ 已删除ID对应的训练数据: {id}")
        # 删除训练数据
        if id:
            vn.remove_training_data(id=id)
            logger.info(f"✅ 已删除ID对应的训练数据: {id}")

        return {"id": id, "type": "remove_training_data", "message": "训练数据删除成功"}
    except Exception as e:
        logger.error(f"❌ 删除训练数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/get_training_data", response_model=TrainingDataResponse, summary="获取训练数据"
)
async def get_training_data(user: Any = Depends(require_auth)):
    """
    获取所有训练数据

    返回系统中所有的训练数据，包括问题、SQL、DDL和文档说明。
    """
    try:
        df = vn.get_training_data()
        return {
            "type": "df",
            "id": "training_data",
            "df": df.head(25).to_json(orient="records"),
        }
    except Exception as e:
        logger.error(f"❌ 获取训练数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
