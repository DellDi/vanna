"""
数据库仓库模块 - 处理数据库操作的高级接口
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Union, Tuple
from datetime import datetime
import json

from .database import (
    Question, SQLQuery, DataFrame, PlotlyFigure,
    Summary, FollowupQuestion, TrainingData
)


class BaseRepository:
    """基础仓库类"""

    def __init__(self, db: Session):
        """初始化仓库"""
        self.db = db


class QuestionRepository(BaseRepository):
    """问题仓库"""

    def create(self, text: str) -> Question:
        """创建新问题"""
        question = Question(text=text)
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        return question

    def get_by_id(self, question_id: str) -> Optional[Question]:
        """通过ID获取问题"""
        return self.db.query(Question).filter(Question.id == question_id).first()

    def get_all(self, limit: int = 100, offset: int = 0) -> List[Question]:
        """获取所有问题"""
        return self.db.query(Question).order_by(Question.created_at.desc()).offset(offset).limit(limit).all()

    def update(self, question_id: str, text: str) -> Optional[Question]:
        """更新问题"""
        question = self.get_by_id(question_id)
        if question:
            question.text = text
            question.updated_at = datetime.now()
            self.db.commit()
            self.db.refresh(question)
        return question

    def delete(self, question_id: str) -> bool:
        """删除问题"""
        question = self.get_by_id(question_id)
        if question:
            self.db.delete(question)
            self.db.commit()
            return True
        return False


class SQLQueryRepository(BaseRepository):
    """SQL查询仓库"""

    def create(self, question_id: str, text: str) -> SQLQuery:
        """创建新SQL查询"""
        sql_query = SQLQuery(question_id=question_id, text=text)
        self.db.add(sql_query)
        self.db.commit()
        self.db.refresh(sql_query)
        return sql_query

    def get_by_question_id(self, question_id: str) -> Optional[SQLQuery]:
        """通过问题ID获取SQL查询"""
        return self.db.query(SQLQuery).filter(SQLQuery.question_id == question_id).first()

    def update(self, question_id: str, text: str) -> Optional[SQLQuery]:
        """更新SQL查询"""
        sql_query = self.get_by_question_id(question_id)
        if sql_query:
            sql_query.text = text
            self.db.commit()
            self.db.refresh(sql_query)
            return sql_query
        return None


class DataFrameRepository(BaseRepository):
    """数据框仓库"""

    def create(self, question_id: str, data: Union[str, Dict, List]) -> DataFrame:
        """创建新数据框"""
        # 确保数据是JSON格式
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except json.JSONDecodeError:
                raise ValueError("数据必须是有效的JSON字符串")

        dataframe = DataFrame(question_id=question_id, data=data)
        self.db.add(dataframe)
        self.db.commit()
        self.db.refresh(dataframe)
        return dataframe

    def get_by_question_id(self, question_id: str) -> Optional[DataFrame]:
        """通过问题ID获取数据框"""
        return self.db.query(DataFrame).filter(DataFrame.question_id == question_id).first()


class PlotlyFigureRepository(BaseRepository):
    """Plotly图表仓库"""

    def create(self, question_id: str, figure_json: Union[str, Dict]) -> PlotlyFigure:
        """创建新Plotly图表"""
        # 确保数据是JSON格式
        if isinstance(figure_json, str):
            try:
                figure_json = json.loads(figure_json)
            except json.JSONDecodeError:
                raise ValueError("图表数据必须是有效的JSON字符串")

        figure = PlotlyFigure(question_id=question_id, figure_json=figure_json)
        self.db.add(figure)
        self.db.commit()
        self.db.refresh(figure)
        return figure

    def get_by_question_id(self, question_id: str) -> Optional[PlotlyFigure]:
        """通过问题ID获取Plotly图表"""
        return self.db.query(PlotlyFigure).filter(PlotlyFigure.question_id == question_id).first()


class SummaryRepository(BaseRepository):
    """摘要仓库"""

    def create(self, question_id: str, text: str) -> Summary:
        """创建新摘要"""
        summary = Summary(question_id=question_id, text=text)
        self.db.add(summary)
        self.db.commit()
        self.db.refresh(summary)
        return summary

    def get_by_question_id(self, question_id: str) -> Optional[Summary]:
        """通过问题ID获取摘要"""
        return self.db.query(Summary).filter(Summary.question_id == question_id).first()


class FollowupQuestionRepository(BaseRepository):
    """后续问题仓库"""

    def create_many(self, question_id: str, texts: List[str]) -> List[FollowupQuestion]:
        """创建多个后续问题"""
        followup_questions = []
        for i, text in enumerate(texts):
            followup = FollowupQuestion(question_id=question_id, text=text, order=i)
            self.db.add(followup)
            followup_questions.append(followup)

        self.db.commit()
        for followup in followup_questions:
            self.db.refresh(followup)

        return followup_questions

    def get_by_question_id(self, question_id: str) -> List[FollowupQuestion]:
        """通过问题ID获取所有后续问题"""
        return self.db.query(FollowupQuestion).filter(
            FollowupQuestion.question_id == question_id
        ).order_by(FollowupQuestion.order).all()


class TrainingDataRepository(BaseRepository):
    """训练数据仓库"""

    def create(self,
               question: Optional[str] = None,
               sql: Optional[str] = None,
               ddl: Optional[str] = None,
               documentation: Optional[str] = None) -> TrainingData:
        """创建新训练数据"""
        training_data = TrainingData(
            question=question,
            sql=sql,
            ddl=ddl,
            documentation=documentation
        )
        self.db.add(training_data)
        self.db.commit()
        self.db.refresh(training_data)
        return training_data

    def get_by_id(self, training_id: str) -> Optional[TrainingData]:
        """通过ID获取训练数据"""
        return self.db.query(TrainingData).filter(TrainingData.id == training_id).first()

    def get_all(self) -> List[TrainingData]:
        """获取所有训练数据"""
        return self.db.query(TrainingData).order_by(TrainingData.created_at.desc()).all()

    def delete(self, training_id: str) -> bool:
        """删除训练数据"""
        training_data = self.get_by_id(training_id)
        if training_data:
            self.db.delete(training_data)
            self.db.commit()
            return True
        return False
