"""
数据库模型定义 - 使用SQLAlchemy ORM
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, JSON, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from typing import Dict, Any, List, Optional
import uuid

Base = declarative_base()


def generate_uuid() -> str:
    """生成UUID字符串"""
    return str(uuid.uuid4())


class Question(Base):
    """用户问题模型"""
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    text = Column(Text, nullable=False, comment="问题文本")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    # 关联数据
    sql_query = relationship("SQLQuery", back_populates="question", uselist=False)
    data_frame = relationship("DataFrame", back_populates="question", uselist=False)
    plotly_figure = relationship("PlotlyFigure", back_populates="question", uselist=False)
    summary = relationship("Summary", back_populates="question", uselist=False)
    followup_questions = relationship("FollowupQuestion", back_populates="question")
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "text": self.text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class SQLQuery(Base):
    """SQL查询模型"""
    __tablename__ = "sql_queries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    text = Column(Text, nullable=False, comment="SQL查询文本")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    
    # 关联
    question = relationship("Question", back_populates="sql_query")
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "question_id": self.question_id,
            "text": self.text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class DataFrame(Base):
    """数据框模型"""
    __tablename__ = "dataframes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    data = Column(JSON, nullable=False, comment="JSON格式的数据框")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    
    # 关联
    question = relationship("Question", back_populates="data_frame")
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "question_id": self.question_id,
            "data": self.data,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class PlotlyFigure(Base):
    """Plotly图表模型"""
    __tablename__ = "plotly_figures"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    figure_json = Column(JSON, nullable=False, comment="Plotly图表JSON")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    
    # 关联
    question = relationship("Question", back_populates="plotly_figure")
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "question_id": self.question_id,
            "figure_json": self.figure_json,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Summary(Base):
    """数据摘要模型"""
    __tablename__ = "summaries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    text = Column(Text, nullable=False, comment="摘要文本")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    
    # 关联
    question = relationship("Question", back_populates="summary")
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "question_id": self.question_id,
            "text": self.text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class FollowupQuestion(Base):
    """后续问题模型"""
    __tablename__ = "followup_questions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question_id = Column(String(36), ForeignKey("questions.id"), nullable=False)
    text = Column(Text, nullable=False, comment="问题文本")
    order = Column(Integer, nullable=False, default=0, comment="排序顺序")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    
    # 关联
    question = relationship("Question", back_populates="followup_questions")
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "question_id": self.question_id,
            "text": self.text,
            "order": self.order,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TrainingData(Base):
    """训练数据模型"""
    __tablename__ = "training_data"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    question = Column(Text, nullable=True, comment="训练问题")
    sql = Column(Text, nullable=True, comment="SQL查询")
    ddl = Column(Text, nullable=True, comment="DDL语句")
    documentation = Column(Text, nullable=True, comment="文档内容")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")
    
    def to_dict(self) -> Dict[str, Any]:
        """转换为字典"""
        return {
            "id": self.id,
            "question": self.question,
            "sql": self.sql,
            "ddl": self.ddl,
            "documentation": self.documentation,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
