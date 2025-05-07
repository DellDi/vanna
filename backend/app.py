import os
import sys
import logging
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 设置导入路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 加载环境变量
load_dotenv()

# 初始化Vanna实例
logger = logging.getLogger(__name__)

# 尝试从 main.run 导入 vn 实例
try:
    # 先尝试从原始路径导入
    from main.run import vn as main_vn
    vn = main_vn
    logger.info("✅ 从 main.run 成功导入 Vanna 实例")
except ImportError:
    logger.warning("⚠️ 无法从 main.run 导入 Vanna 实例，将创建新实例")

# 创建API应用
app = FastAPI(
    title="ChartBI API",
    description="这是一个由delldi开发的文本转SQL(Text-to-SQL)服务API，基于FastAPI构建，提供自然语言到SQL查询的转换功能。该服务采用模块化架构设计，包含完整的API文档和前端交互界面。",
    version="0.2.2",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
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

# 先注册 API 路由
from backend.routes.base import router as base_router
from backend.routes.question import router as question_router
from backend.routes.training import router as training_router
from backend.routes.extension import router as extension_router

# 直接注册各个子路由，而不是通过主路由
# app.include_router(base_router, prefix="/api/v0")
app.include_router(question_router, prefix="/api/v0")
# app.include_router(training_router, prefix="/api/v0")
app.include_router(extension_router, prefix="/api/v0")

# 初始化完成日志
logger.info("✅ Vanna实例初始化完成")

# 检查静态文件目录是否存在
static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.exists(static_dir) and os.path.isdir(static_dir):
    # 先挂载静态文件目录到特定路径
    app.mount("/static", StaticFiles(directory=static_dir), name="static")
    logger.info(f"✅ 静态文件目录挂载成功: {static_dir}")
else:
    logger.warning(f"⚠️ 静态文件目录不存在: {static_dir}")

if __name__ == '__main__':
    uvicorn.run('backend.app:app', host='0.0.0.0', port=int(os.getenv('PORT', 8000)), reload=True)
