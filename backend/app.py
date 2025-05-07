import os
import sys
import logging
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 从 main.run 导入 Vanna 实例的创建工厂
from main.run import create_vanna_instance

# 设置导入路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 加载环境变量
load_dotenv()

# 初始化日志
logger = logging.getLogger(__name__)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)

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

# 在 app 实例化之后，路由导入之前，创建 Vanna 实例
try:
    vn = create_vanna_instance()  # 调用工厂函数创建 Vanna 实例
    logger.info("✅ Vanna 实例成功创建并初始化")
except Exception as e:
    logger.error(f"❌ 创建或初始化 Vanna 实例失败: {e}")
    # 如果 vn 创建失败，后续依赖 vn 的路由会出问题。
    # 生产环境中，这里可能需要更健壮的错误处理，例如阻止应用启动。
    vn = None # 确保 vn 被定义，即使是 None

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
# app.include_router(question_router, prefix="/api/v0")
# app.include_router(training_router, prefix="/api/v0")
app.include_router(extension_router, prefix="/api/v0")

# 初始化完成日志
if vn:
    logger.info("✅ Vanna实例初始化完成")
else:
    logger.warning("⚠️ Vanna实例未能成功初始化，部分功能可能受限")

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
