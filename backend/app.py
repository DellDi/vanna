import os
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
# 导入路由模块
from backend.routes import router as api_router

from dotenv import load_dotenv
import sys
import os


sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 加载环境变量
load_dotenv()

app = FastAPI(
    title="ChartBI API",
    description="API for texttosql services created by delldi",
    version="0.1.0",
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_version="3.1.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应该限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(api_router)

# 挂载静态文件目录
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == '__main__':
    uvicorn.run('backend.app:app', host='0.0.0.0', port=int(os.getenv('PORT', 8000)), reload=True)
