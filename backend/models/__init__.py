"""
模型包初始化文件 - 提供便捷导入
"""

# 导出Pydantic模型
from .schemas import (
    BaseResponse,
    InitializeResponse,
    QuestionListResponse,
    GenerateSQLResponse,
    DataFrameResponse,
    PlotlyFigureResponse,
    TextResponse,
    QuestionCacheResponse,
    RemoveTrainingDataRequest,
    TrainRequest,
    UpdateSQLRequest,
    RewrittenQuestionResponse,
    DeleteQuestionRequest,
    DeleteResponse,
    ConfigResponse,
    ErrorResponse,
    TrainingDataResponse,
    RemoveTrainingDataResponse
)

# 导出数据库模型
from .database import (
    Base,
    Question,
    SQLQuery,
    DataFrame,
    PlotlyFigure,
    Summary,
    FollowupQuestion,
    TrainingData
)

# 导出数据库配置
from .database_config import (
    get_db,
    get_db_session,
    create_all_tables,
    init_db
)

# 导出仓库
from .repositories import (
    QuestionRepository,
    SQLQueryRepository,
    DataFrameRepository,
    PlotlyFigureRepository,
    SummaryRepository,
    FollowupQuestionRepository,
    TrainingDataRepository
)

__all__ = [
    # Pydantic模型
    'BaseResponse',
    'InitializeResponse',
    'QuestionListResponse',
    'GenerateSQLResponse',
    'DataFrameResponse',
    'PlotlyFigureResponse',
    'TextResponse',
    'QuestionCacheResponse',
    'RemoveTrainingDataRequest',
    'TrainRequest',
    'UpdateSQLRequest',
    'RewrittenQuestionResponse',
    'DeleteQuestionRequest',
    'DeleteResponse',
    'ConfigResponse',
    'ErrorResponse',
    'RemoveTrainingDataResponse',
    'TrainingDataResponse',

    # 数据库模型
    'Base',
    'Question',
    'SQLQuery',
    'DataFrame',
    'PlotlyFigure',
    'Summary',
    'FollowupQuestion',
    'TrainingData',

    # 数据库配置
    'get_db',
    'get_db_session',
    'create_all_tables',
    'init_db',

    # 仓库
    'QuestionRepository',
    'SQLQueryRepository',
    'DataFrameRepository',
    'PlotlyFigureRepository',
    'SummaryRepository',
    'FollowupQuestionRepository',
    'TrainingDataRepository'
]
