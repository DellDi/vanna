"""
FastAPI路由模块，将API路由与主应用分离
"""
from typing import Any, Dict, List, Optional, Union
from fastapi import APIRouter, HTTPException, Depends, Query, Request, Body
from fastapi.responses import Response as FastAPIResponse
from pydantic import BaseModel, Field

from main.run import vn
from backend.cache import MemoryCache

# 初始化缓存和路由
cache = MemoryCache()
router = APIRouter(prefix="/api/v0", tags=["ChartBI API"])

# 依赖注入函数
def require_cache(fields: List[str]):
    def dependency(request: Request):
        id = request.query_params.get('id')
        if not id:
            raise HTTPException(status_code=400, detail="No id provided")
        for field in fields:
            value = cache.get(id=id, field=field)
            if value is None:
                raise HTTPException(status_code=400, detail=f"No {field} found")
        return {"id": id, **{field: cache.get(id=id, field=field) for field in fields}}
    return Depends(dependency)

# 响应模型
class QuestionListResponse(BaseModel):
    type: str = Field("question_list", description="响应类型")
    questions: List[str] = Field(..., description="问题列表")
    header: str = Field(..., description="问题列表标题")

class GenerateSQLResponse(BaseModel):
    type: str = Field("sql", description="响应类型")
    id: str = Field(..., description="生成的唯一ID")
    text: str = Field(..., description="生成的SQL查询")

class DataFrameResponse(BaseModel):
    type: str = Field("df", description="响应类型")
    id: str = Field(..., description="数据ID")
    df: str = Field(..., description="JSON格式的数据框")

class PlotlyFigureResponse(BaseModel):
    type: str = Field("plotly_figure", description="响应类型")
    id: str = Field(..., description="图表ID")
    fig: str = Field(..., description="Plotly图表JSON")

class RemoveTrainingDataRequest(BaseModel):
    id: str = Field(..., description="训练数据ID")

class TrainRequest(BaseModel):
    question: Optional[str] = Field(None, description="训练问题")
    sql: Optional[str] = Field(None, description="SQL查询")
    ddl: Optional[str] = Field(None, description="DDL语句")
    documentation: Optional[str] = Field(None, description="文档内容")

# 路由定义
@router.get('/generate_questions', response_model=QuestionListResponse, summary="生成问题列表")
async def generate_questions():
    """
    生成一系列可以提问的自然语言问题
    """
    return {"type": "question_list", "questions": vn.generate_questions(), "header": "Here are some questions you can ask:"}

@router.get('/generate_sql', response_model=GenerateSQLResponse, summary="生成SQL查询")
async def generate_sql(question: str = Query(..., description="自然语言问题")):
    """
    根据自然语言问题生成SQL查询
    """
    id = cache.generate_id(question=question)
    sql = vn.generate_sql(question=question)
    cache.set(id=id, field='question', value=question)
    cache.set(id=id, field='sql', value=sql)
    return {"type": "sql", "id": id, "text": sql}

@router.get('/run_sql', response_model=DataFrameResponse, summary="执行SQL查询")
async def run_sql(data: Dict[str, Any] = require_cache(['sql'])):
    """
    执行生成的SQL查询并返回结果
    """
    id = data['id']; sql = data['sql']
    try:
        df = vn.run_sql(sql=sql)
        cache.set(id=id, field='df', value=df)
        return {"type": "df", "id": id, "df": df.head(10).to_json(orient='records')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/download_csv', summary="下载CSV文件")
async def download_csv(data: Dict[str, Any] = require_cache(['df'])):
    """
    将数据框导出为CSV文件并下载
    """
    id = data['id']; df = data['df']
    csv = df.to_csv()
    return FastAPIResponse(content=csv, media_type="text/csv", headers={"Content-Disposition": f"attachment; filename={id}.csv"})

@router.get('/generate_plotly_figure', response_model=PlotlyFigureResponse, summary="生成Plotly可视化")
async def generate_plotly_figure(data: Dict[str, Any] = require_cache(['df', 'question', 'sql'])):
    """
    根据数据生成Plotly可视化图表
    """
    id = data['id']; df = data['df']; question = data['question']; sql = data['sql']
    try:
        code = vn.generate_plotly_code(question=question, sql=sql, df_metadata=f"Running df.dtypes gives:\n {df.dtypes}")
        fig = vn.get_plotly_figure(plotly_code=code, df=df, dark_mode=False)
        fig_json = fig.to_json()
        cache.set(id=id, field='fig_json', value=fig_json)
        return {"type": "plotly_figure", "id": id, "fig": fig_json}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/get_training_data', response_model=DataFrameResponse, summary="获取训练数据")
async def get_training_data():
    """
    获取当前的训练数据
    """
    df = vn.get_training_data()
    return {"type": "df", "id": "training_data", "df": df.head(25).to_json(orient='records')}

@router.post('/remove_training_data', summary="删除训练数据")
async def remove_training_data(req: RemoveTrainingDataRequest):
    """
    删除指定ID的训练数据
    """
    if vn.remove_training_data(id=req.id):
        return {"success": True}
    raise HTTPException(status_code=400, detail="Couldn't remove training data")

@router.post('/train', summary="添加训练数据")
async def add_training_data(req: TrainRequest):
    """
    添加新的训练数据
    """
    try:
        id = vn.train(question=req.question, sql=req.sql, ddl=req.ddl, documentation=req.documentation)
        return {"id": id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/generate_followup_questions', response_model=QuestionListResponse, summary="生成后续问题")
async def generate_followup_questions(data: Dict[str, Any] = require_cache(['df', 'question', 'sql'])):
    """
    根据当前问题和数据生成后续问题
    """
    id = data['id']; df = data['df']; question = data['question']; sql = data['sql']
    followup_questions = vn.generate_followup_questions(question=question, sql=sql, df=df)
    cache.set(id=id, field='followup_questions', value=followup_questions)
    return {"type": "question_list", "id": id, "questions": followup_questions, "header": "Here are some followup questions you can ask:"}

@router.get('/load_question', summary="加载已存问题")
async def load_question(data: Dict[str, Any] = require_cache(['question', 'sql', 'df', 'fig_json', 'followup_questions'])):
    """
    加载已缓存的问题及其相关数据
    """
    id = data['id']; question = data['question']; sql = data['sql']; df = data['df']; fig_json = data['fig_json']; followup_questions = data['followup_questions']
    return {"type": "question_cache", "id": id, "question": question, "sql": sql, "df": df.head(10).to_json(orient='records'), "fig": fig_json, "followup_questions": followup_questions}

@router.get('/get_question_history', summary="获取问题历史")
async def get_question_history():
    """
    获取历史问题列表
    """
    return {"type": "question_history", "questions": cache.get_all(field_list=['question'])}
