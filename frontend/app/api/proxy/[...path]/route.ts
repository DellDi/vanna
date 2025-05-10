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
    // 获取路径参数和查询参数
    const path = `/${params.path.join('/')}`;
    const { searchParams } = new URL(request.url);

    // 构建后端API URL
    const backendUrl = `${getBackendBaseUrl()}${path}${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
    }`;

    console.log(`[API代理] GET 请求: ${backendUrl}`);

    // 发送请求到后端API
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 处理响应
    const data = await handleApiResponse(response);
    return NextResponse.json(data);
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
    // 获取路径参数和请求体
    const path = `/${params.path.join('/')}`;
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // 构建后端API URL
    const backendUrl = `${getBackendBaseUrl()}${path}${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
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
    // 获取路径参数和请求体
    const path = `/${params.path.join('/')}`;
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    // 构建后端API URL
    const backendUrl = `${getBackendBaseUrl()}${path}${
      searchParams.toString() ? `?${searchParams.toString()}` : ''
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
