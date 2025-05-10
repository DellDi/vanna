/**
 * API代理工具函数
 * 用于处理与后端API的通信
 */

// 获取后端API基础URL
export const getBackendBaseUrl = (): string => {
  return `${process.env.NEXT_FAST_API_BASE_URL || ''}/api/v0`;
};

// 处理API响应
export async function handleApiResponse(response: Response) {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API请求失败: ${response.status} - ${errorText}`);
  }
  
  // 检查内容类型
  const contentType = response.headers.get('content-type');
  
  // 如果是JSON，解析并返回
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  
  // 否则返回文本
  return response.text();
}

// 创建代理请求配置
export function createProxyRequestInit(
  method: string = 'GET',
  body?: any,
  headers?: HeadersInit
): RequestInit {
  const requestInit: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    requestInit.body = JSON.stringify(body);
  }

  return requestInit;
}

// 构建URL查询参数
export function buildQueryString(params: Record<string, string>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value);
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
