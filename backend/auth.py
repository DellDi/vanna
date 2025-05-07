"""
认证模块 - 提供认证接口和实现
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from fastapi import Request, HTTPException, Depends


class AuthInterface(ABC):
    """认证接口基类"""
    
    @abstractmethod
    def get_user(self, request: Request) -> Any:
        """从请求中获取用户信息"""
        pass
    
    @abstractmethod
    def is_logged_in(self, user: Any) -> bool:
        """检查用户是否已登录"""
        pass
    
    @abstractmethod
    def override_config_for_user(self, user: Any, config: Dict) -> Dict:
        """根据用户覆盖配置"""
        pass
    
    @abstractmethod
    def login_form(self) -> str:
        """获取登录表单HTML"""
        pass


class NoAuth(AuthInterface):
    """无认证实现 - 默认允许所有请求"""
    
    def get_user(self, request: Request) -> Any:
        """从请求中获取用户信息"""
        return {}
    
    def is_logged_in(self, user: Any) -> bool:
        """检查用户是否已登录"""
        return True
    
    def override_config_for_user(self, user: Any, config: Dict) -> Dict:
        """根据用户覆盖配置"""
        return config
    
    def login_form(self) -> str:
        """获取登录表单HTML"""
        return ""


# 默认认证实例
auth = NoAuth()


# 认证依赖项
def require_auth(request: Request):
    """认证依赖项，用于路由保护"""
    user = auth.get_user(request)
    
    if not auth.is_logged_in(user):
        raise HTTPException(
            status_code=401,
            detail="未登录",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user
