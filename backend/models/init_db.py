"""
数据库初始化脚本
"""

import logging
import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(str(Path(__file__).parent.parent.parent))

from backend.models.database_config import init_db

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def main():
    """初始化数据库"""
    logger.info("开始初始化数据库...")
    try:
        init_db()
        logger.info("✅ 数据库初始化成功!")
    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
