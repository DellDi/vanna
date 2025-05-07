"""
缓存工具模块 - 提供缓存相关的工具函数和依赖类
"""
import logging
from typing import Any, Dict, List, Optional

from fastapi import Depends, HTTPException, Request
from backend.cache import cache

# 日志配置
logger = logging.getLogger(__name__)


class RequireCache:
    """
    缓存依赖类，用于从缓存中获取数据
    
    使用方法:
    ```python
    @router.get("/endpoint")
    async def endpoint(data: Dict[str, Any] = require_cache(fields=["field1", "field2"])):
        # 使用 data["field1"], data["field2"] 等
    ```
    
    或者使用显式参数:
    ```python
    @router.get("/endpoint")
    async def endpoint(id: str = Query(..., description="问题ID")):
        # 使用 RequireCache 获取数据
        data = RequireCache(fields=["field1", "field2"])(Request(scope={"type": "http", "query_string": f"id={id}".encode()}))
    ```
    """
    def __init__(self, fields: List[str], optional_fields: List[str] = None):
        """
        初始化缓存依赖类
        
        Args:
            fields: 必需的字段列表
            optional_fields: 可选的字段列表
        """
        self.fields = fields
        self.optional_fields = optional_fields or []
    
    def __call__(self, request: Request) -> Dict[str, Any]:
        """
        从缓存中获取数据
        
        Args:
            request: FastAPI请求对象
            
        Returns:
            包含所有请求字段的字典
            
        Raises:
            HTTPException: 如果缓存中没有找到必需字段
        """
        id = request.query_params.get("id")
        logger.info(f"🔍 请求ID: {id}, 必需字段: {self.fields}, 可选字段: {self.optional_fields}")
        
        if not id:
            logger.error("❌ 未提供ID参数")
            raise HTTPException(status_code=400, detail="未提供ID参数")
        
        # 检查必需字段
        for field in self.fields:
            value = cache.get(id=id, field=field)
            if value is None:
                logger.error(f"❌ 缓存中未找到必需字段: {field}")
                raise HTTPException(status_code=400, detail=f"缓存中未找到必需字段: {field}")
        
        # 获取所有字段（包括可选字段）
        result = {"id": id}
        for field in self.fields + self.optional_fields:
            result[field] = cache.get(id=id, field=field)
        
        return result


def require_cache(fields: List[str], optional_fields: List[str] = None):
    """
    创建缓存依赖
    
    Args:
        fields: 必需的字段列表
        optional_fields: 可选的字段列表
        
    Returns:
        FastAPI依赖函数
    """
    return Depends(RequireCache(fields, optional_fields))


# 这里只保留 RequireCache 类和 require_cache 函数
# 不添加其他函数，保持原有的依赖注入逻辑
