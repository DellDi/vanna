/**
 * 通用API代理路由 - 使用动态路由捕获所有API请求
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl, handleApiResponse } from '../utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path: pathParams } = await params;
    // 获取路径参数和查询参数
    const path = `/${pathParams.join('/')}`;
    const { searchParams } = new URL(request.url);

    // 构建后端API URL
    const backendUrl = `${getBackendBaseUrl()}${path}${searchParams.toString() ? `?${searchParams.toString()}` : ''
      }`;

    console.log(`[API代理] GET 请求: ${backendUrl}`);

    // 发送请求到后端API
    const response = await fetch(backendUrl);

    // 检查响应状态
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }

    // 获取响应的内容类型
    const contentType = response.headers.get('content-type') || '';

    // 处理不同类型的响应
    if (contentType.includes('application/json')) {
      // JSON 响应
      const data = await response.json();
      return NextResponse.json(data);
    } else if (
      contentType.includes('text/csv') ||
      contentType.includes('application/octet-stream') ||
      contentType.includes('application/vnd.ms-excel') ||
      contentType.includes('application/pdf') ||
      contentType.includes('image/')
    ) {
      // 文件下载响应
      const blob = await response.blob();

      // 从原始响应中获取文件名
      const contentDisposition = response.headers.get('content-disposition');
      let filename = '';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // 创建新的响应
      return new NextResponse(blob, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': contentDisposition || `attachment; filename="${filename || 'download'}"`
        }
      });
    } else {
      // 其他类型的响应，例如纯文本
      const text = await response.text();
      return new NextResponse(text, {
        headers: {
          'Content-Type': contentType
        }
      });
    }
  } catch (error) {
    console.error('[API代理] GET 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path: pathParams } = await params;
    // 获取路径参数和请求体
    const path = `/${pathParams.join('/')}`;
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // 构建后端API URL
    const backendUrl = `${getBackendBaseUrl()}${path}${searchParams.toString() ? `?${searchParams.toString()}` : ''
      }`;

    console.log(`[API代理] POST 请求: ${backendUrl}`, body);

    // 发送请求到后端API
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // 处理响应
    const data = await handleApiResponse(response);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API代理] POST 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const { path: pathParams } = await params;
    // 获取路径参数和请求体
    const path = `/${pathParams.join('/')}`;
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // 构建后端API URL
    const backendUrl = `${getBackendBaseUrl()}${path}${searchParams.toString() ? `?${searchParams.toString()}` : ''
      }`;

    console.log(`[API代理] DELETE 请求: ${backendUrl}`, body);

    // 发送请求到后端API
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // 处理响应
    const data = await handleApiResponse(response);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API代理] DELETE 错误:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}
