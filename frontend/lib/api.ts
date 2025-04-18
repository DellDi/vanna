/**
 * API服务层 - 处理与后端的所有通信
 */

import { 
  QuestionListResponse, 
  GenerateSQLResponse, 
  DataFrameResponse, 
  PlotlyFigureResponse,
  QuestionCacheResponse,
  QuestionHistoryResponse,
  TrainingData,
  TrainRequest
} from './types';

const API_BASE_URL = `${process.env.NEXT_FAST_API_BASE_URL}/api/v0`;

/**
 * 生成问题列表`
 */
export async function generateQuestions(): Promise<QuestionListResponse> {
  const response = await fetch(`${API_BASE_URL}/generate_questions`);
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 生成SQL查询
 */
export async function generateSQL(question: string): Promise<GenerateSQLResponse> {
  const response = await fetch(`${API_BASE_URL}/generate_sql?question=${encodeURIComponent(question)}`);
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 执行SQL查询
 */
export async function runSQL(id: string): Promise<DataFrameResponse> {
  const response = await fetch(`${API_BASE_URL}/run_sql?id=${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 下载CSV文件
 */
export function getCSVDownloadURL(id: string): string {
  return `${API_BASE_URL}/download_csv?id=${encodeURIComponent(id)}`;
}

/**
 * 生成Plotly可视化
 */
export async function generatePlotlyFigure(id: string): Promise<PlotlyFigureResponse> {
  const response = await fetch(`${API_BASE_URL}/generate_plotly_figure?id=${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 获取训练数据
 */
export async function getTrainingData(): Promise<DataFrameResponse> {
  const response = await fetch(`${API_BASE_URL}/get_training_data`);
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 删除训练数据
 */
export async function removeTrainingData(id: string): Promise<{success: boolean}> {
  const response = await fetch(`${API_BASE_URL}/remove_training_data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  });
  
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 添加训练数据
 */
export async function addTrainingData(data: TrainRequest): Promise<{id: string}> {
  const response = await fetch(`${API_BASE_URL}/train`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 生成后续问题
 */
export async function generateFollowupQuestions(id: string): Promise<QuestionListResponse> {
  const response = await fetch(`${API_BASE_URL}/generate_followup_questions?id=${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 加载已存问题
 */
export async function loadQuestion(id: string): Promise<QuestionCacheResponse> {
  const response = await fetch(`${API_BASE_URL}/load_question?id=${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 获取问题历史
 */
export async function getQuestionHistory(): Promise<QuestionHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/get_question_history`);
  if (!response.ok) {
    throw new Error(`请求失败: ${response.status}`);
  }
  return response.json();
}

/**
 * 新建对话
 * 清除当前会话并初始化新的对话
 */
export async function createNewConversation(): Promise<{success: boolean}> {
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
    const response = await fetch(`${API_BASE_URL}/generate_questions`);
    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }
    return response.json();
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
