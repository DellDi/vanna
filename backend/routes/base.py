"""
基础路由模块 - 包含初始化、配置等基础接口
"""
import importlib
import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from backend.auth import require_auth, auth
from backend.cache import cache
from backend.models import (
    ConfigResponse,
    InitializeResponse,
)

# 创建路由
router = APIRouter(tags=["基础"])

# 日志配置
logger = logging.getLogger(__name__)

# 全局配置
config = {
    "ui": {
        "title": "ChartBI API",
        "description": "自然语言到SQL查询转换服务",
        "logo": "/static/logo.png",
        "favicon": "/static/favicon.ico",
        "primary_color": "#4f46e5",
    },
    "features": {
        "allow_training": True,
        "allow_sql_editing": True,
        "allow_llm_to_see_data": True,
        "show_sql": True,
    },
    "version": "0.2.2",
}


@router.get("/", response_model=InitializeResponse, summary="API根路径")
async def root():
    """
    API根路径，返回初始化信息
    """
    return {"type": "initialize", "message": "ChartBI API 服务已就绪"}


@router.get("/get_config", response_model=ConfigResponse, summary="获取配置信息")
async def get_config(user: Any = Depends(require_auth)):
    """
    获取用户配置信息
    
    返回当前用户的配置信息，包括界面设置和功能开关等。
    如果用户未登录，将返回401错误。
    """
    # 根据用户覆盖配置
    from backend.auth import auth
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
