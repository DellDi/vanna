/**
 * API客户端 - 通过Next.js API路由代理调用后端服务
 * 保持与原有api.ts接口兼容，但使用新的代理路由
 */

import {
  InitializeResponse,
  QuestionListResponse,
  GenerateSQLResponse,
  DataFrameResponse,
  PlotlyFigureResponse,
  QuestionCacheResponse,
  QuestionHistoryResponse,
  TrainingData,
  TrainRequest,
  TextResponse,
  RewrittenQuestionResponse,
  DeleteResponse
} from './types';
import { toast } from 'sonner';
// 代理API基础URL
const PROXY_API_BASE_URL = '/api/proxy';

/**
 * 通用API请求函数
 */
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'DELETE' = 'GET',
  params: Record<string, string> = {},
  body?: any
): Promise<T> {
  // 构建查询参数
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) queryParams.append(key, value);
  });

  // 构建完整URL
  const url = `${PROXY_API_BASE_URL}${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  // 请求配置
  const requestOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 添加请求体（如果有）
  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  // 发送请求
  const response = await fetch(url);

  // 处理错误
  if (!response.ok) {
    toast.error(`请求失败: ${response.status}`);
    throw new Error(`请求失败: ${response.status}`);
  }

  // 返回响应数据
  return response.json();
}

/**
 * 初始化应用
 */
export async function initialize(): Promise<InitializeResponse> {
  return apiRequest<InitializeResponse>('/initialize');
}

/**
 * 生成问题列表
 */
export async function generateQuestions(): Promise<QuestionListResponse> {
  return apiRequest<QuestionListResponse>('/generate_questions');
}

/**
 * 生成SQL查询
 */
export async function generateSQL(question: string): Promise<GenerateSQLResponse> {
  return apiRequest<GenerateSQLResponse>('/generate_sql', 'GET', { question });
}

/**
 * 执行SQL查询
 */
export async function runSQL(id: string): Promise<DataFrameResponse> {
  return apiRequest<DataFrameResponse>('/run_sql', 'GET', { id });
}

/**
 * 生成内容摘要
 */
export async function generateSummary(id: string): Promise<TextResponse> {
  return apiRequest<TextResponse>('/generate_summary', 'GET', { id });
}

/**
 * 生成重写后的问题
 * @param lastQuestion 上一个问题
 * @param newQuestion 新问题
 * @returns 重写后的问题响应
 */
export async function generateRewrittenQuestion(
  lastQuestion: string,
  newQuestion: string
): Promise<RewrittenQuestionResponse> {
  return apiRequest<RewrittenQuestionResponse>(
    '/generate_rewritten_question',
    'GET',
    { last_question: lastQuestion, new_question: newQuestion }
  );
}

/**
 * 删除问题记录
 * @param id 要删除的问题ID
 * @returns 删除操作响应
 */
export async function deleteQuestion(id: string): Promise<DeleteResponse> {
  return apiRequest<DeleteResponse>('/delete_question', 'DELETE', {}, { id });
}

/**
 * 下载CSV文件
 */
export function getCSVDownloadURL(id: string): string {
  return `${PROXY_API_BASE_URL}/download_csv?id=${encodeURIComponent(id)}`;
}

/**
 * 生成Plotly可视化
 */
export async function generatePlotlyFigure(id: string): Promise<PlotlyFigureResponse> {
  return apiRequest<PlotlyFigureResponse>('/generate_plotly_figure', 'GET', { id });
}

/**
 * 获取训练数据
 */
export async function getTrainingData(): Promise<DataFrameResponse> {
  return apiRequest<DataFrameResponse>('/get_training_data');
}

/**
 * 删除训练数据
 */
export async function removeTrainingData(id: string): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('/remove_training_data', 'POST', {}, { id });
}

/**
 * 添加训练数据
 */
export async function addTrainingData(data: TrainRequest): Promise<{ id: string }> {
  return apiRequest<{ id: string }>('/train', 'POST', {}, data);
}

/**
 * 生成后续问题
 */
export async function generateFollowupQuestions(id: string): Promise<QuestionListResponse> {
  return apiRequest<QuestionListResponse>('/generate_followup_questions', 'GET', { id });
}

/**
 * 加载已存问题
 */
export async function loadQuestion(id: string): Promise<QuestionCacheResponse> {
  return apiRequest<QuestionCacheResponse>('/load_question', 'GET', { id });
}

/**
 * 获取问题历史
 */
export async function getQuestionHistory(): Promise<QuestionHistoryResponse> {
  return apiRequest<QuestionHistoryResponse>('/get_question_history');
}

/**
 * 新建对话
 * 清除当前会话并初始化新的对话
 */
export async function createNewConversation(): Promise<{ success: boolean }> {
  // 这里可以添加实际的API调用，如果后端提供了相应的接口
  // 当前我们在前端处理新建对话的逻辑，所以返回一个模拟的成功响应
  return { success: true };
}

/**
 * 生成示例问题
 * 获取一组示例问题帮助用户开始对话
 */
export async function generateExampleQuestions(): Promise<QuestionListResponse> {
  try {
    // 如果后端有专门的接口，可以调用该接口
    // 这里我们使用现有的生成问题接口
    return apiRequest<QuestionListResponse>('/generate_questions');
  } catch (error) {
    // 如果接口调用失败，返回默认的示例问题
    return {
      type: "question_list",
      questions: [
        "中国金茂的收入是多少?",
        "各个项目的收入排名是什么?",
        "去年的总收入是多少?",
        "哪个项目的收入增长最快?"
      ],
      header: "以下是一些您可以提问的问题:"
    };
  }
}
