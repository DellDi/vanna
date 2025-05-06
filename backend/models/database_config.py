"""
数据库连接和会话管理
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager
from typing import Generator
import logging

logger = logging.getLogger("uvicorn")

# 从环境变量获取数据库连接信息
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "sqlite:///./chartbi.db"  # 默认使用SQLite作为开发环境数据库
)

# 创建数据库引擎
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("SQL_ECHO", "false").lower() == "true",  # 是否打印SQL语句
    pool_pre_ping=True,  # 连接池预检查
)

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@contextmanager
def get_db() -> Generator[Session, None, None]:
    """获取数据库会话的上下文管理器"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"数据库操作异常: {str(e)}")
        raise
    finally:
        db.close()


# FastAPI依赖项
def get_db_session() -> Generator[Session, None, None]:
    """FastAPI依赖项，用于获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 创建所有表
def create_all_tables() -> None:
    """创建所有数据库表"""
    from .database import Base
    Base.metadata.create_all(bind=engine)


# 初始化数据库
def init_db() -> None:
    """初始化数据库"""
    try:
        # 创建所有表
        create_all_tables()
        logger.info("✅ 数据库表创建成功")
    except Exception as e:
        logger.error(f"❌ 数据库初始化失败: {str(e)}")
        raise
