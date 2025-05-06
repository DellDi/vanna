"""
API请求和响应的Pydantic模型定义
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


# 基础响应模型
class BaseResponse(BaseModel):
    """所有响应的基础模型"""
    type: str = Field(..., description="响应类型")
    id: Optional[str] = Field(None, description="数据ID")


# 初始化响应
class InitializeResponse(BaseResponse):
    """初始化训练响应"""
    type: str = Field("initialize", description="响应类型")
    message: str = Field(..., description="初始化消息")


# 问题列表响应
class QuestionListResponse(BaseResponse):
    """问题列表响应"""
    type: str = Field("question_list", description="响应类型")
    questions: List[str] = Field(..., description="问题列表")
    header: str = Field(..., description="问题列表标题")


# SQL生成响应
class GenerateSQLResponse(BaseResponse):
    """SQL生成响应"""
    type: str = Field("sql", description="响应类型")
    id: str = Field(..., description="生成的唯一ID")
    text: str = Field(..., description="生成的SQL查询")


# 数据框响应
class DataFrameResponse(BaseResponse):
    """数据框响应"""
    type: str = Field("df", description="响应类型")
    id: str = Field(..., description="数据ID")
    df: str = Field(..., description="JSON格式的数据框")


# Plotly图表响应
class PlotlyFigureResponse(BaseResponse):
    """Plotly图表响应"""
    type: str = Field("plotly_figure", description="响应类型")
    id: str = Field(..., description="图表ID")
    fig: str = Field(..., description="Plotly图表JSON")


# 文本响应
class TextResponse(BaseResponse):
    """文本响应"""
    type: str = Field("text", description="响应类型")
    id: str = Field(..., description="数据ID")
    text: str = Field(..., description="文本内容")


# 问题缓存响应
class QuestionCacheResponse(BaseResponse):
    """问题缓存响应"""
    type: str = Field("question_cache", description="响应类型")
    id: str = Field(..., description="问题ID")
    question: str = Field(..., description="问题文本")
    sql: str = Field(..., description="SQL查询")
    df: str = Field(..., description="数据框JSON")
    fig: Optional[str] = Field(None, description="图表JSON")
    followup_questions: Optional[List[str]] = Field(None, description="后续问题")
    summary: Optional[str] = Field(None, description="数据摘要")


# 请求模型
class RemoveTrainingDataRequest(BaseModel):
    """删除训练数据请求"""
    id: str = Field(..., description="训练数据ID")


class TrainRequest(BaseModel):
    """添加训练数据请求"""
    question: Optional[str] = Field(None, description="训练问题")
    sql: Optional[str] = Field(None, description="SQL查询")
    ddl: Optional[str] = Field(None, description="DDL语句")
    documentation: Optional[str] = Field(None, description="文档内容")


# 错误响应
class ErrorResponse(BaseResponse):
    """错误响应"""
    type: str = Field("error", description="响应类型")
    error: str = Field(..., description="错误信息")
