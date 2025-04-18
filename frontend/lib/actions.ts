/**
 * Server Actions - 使用Next.js的Server Actions特性实现与后端的交互
 */
'use server'

import { 
  QuestionListResponse, 
  GenerateSQLResponse, 
  DataFrameResponse, 
  PlotlyFigureResponse,
  QuestionCacheResponse,
  QuestionHistoryResponse,
  TrainRequest
} from './types';

import * as api from './api';
import { revalidatePath } from 'next/cache';

/**
 * 生成问题列表
 */
export async function generateQuestionsAction(): Promise<QuestionListResponse> {
  try {
    return await api.generateQuestions();
  } catch (error) {
    console.error('生成问题列表失败:', error);
    throw new Error('生成问题列表失败');
  }
}

/**
 * 生成SQL查询
 */
export async function generateSQLAction(question: string): Promise<GenerateSQLResponse> {
  try {
    // 检查问题是否为空
    if (!question || question.trim() === '') {
      throw new Error('问题不能为空');
    }
    
    // 生成SQL查询
    const response = await api.generateSQL(question);
    
    // 处理可能的错误响应
    if (response.text.includes('insufficient_context') || response.text.includes('无法确定')) {
      // 虽然API返回了200，但内容表明生成失败
      console.warn('SQL生成警告: 上下文不足');
    }
    
    return response;
  } catch (error) {
    console.error('生成SQL查询失败:', error);
    if (error instanceof Error) {
      throw new Error(`生成SQL查询失败: ${error.message}`);
    } else {
      throw new Error('生成SQL查询失败: 未知错误');
    }
  }
}

/**
 * 执行SQL查询
 */
export async function runSQLAction(id: string): Promise<DataFrameResponse> {
  try {
    // 检查ID是否有效
    if (!id) {
      throw new Error('无效的查询ID');
    }
    
    // 执行查询
    return await api.runSQL(id);
  } catch (error) {
    console.error('执行SQL查询失败:', error);
    // 重新抛出错误，但提供更详细的信息
    if (error instanceof Error) {
      throw new Error(`执行SQL查询失败: ${error.message}`);
    } else {
      throw new Error('执行SQL查询失败: 未知错误');
    }
  }
}

/**
 * 生成Plotly可视化
 */
export async function generatePlotlyFigureAction(id: string): Promise<PlotlyFigureResponse> {
  try {
    return await api.generatePlotlyFigure(id);
  } catch (error) {
    console.error('生成可视化图表失败:', error);
    throw new Error('生成可视化图表失败');
  }
}

/**
 * 获取训练数据
 */
export async function getTrainingDataAction(): Promise<DataFrameResponse> {
  try {
    return await api.getTrainingData();
  } catch (error) {
    console.error('获取训练数据失败:', error);
    throw new Error('获取训练数据失败');
  }
}

/**
 * 删除训练数据
 */
export async function removeTrainingDataAction(id: string): Promise<{success: boolean}> {
  try {
    const result = await api.removeTrainingData(id);
    revalidatePath('/training-data');
    return result;
  } catch (error) {
    console.error('删除训练数据失败:', error);
    throw new Error('删除训练数据失败');
  }
}

/**
 * 添加训练数据
 */
export async function addTrainingDataAction(data: TrainRequest): Promise<{id: string}> {
  try {
    const result = await api.addTrainingData(data);
    revalidatePath('/training-data');
    return result;
  } catch (error) {
    console.error('添加训练数据失败:', error);
    throw new Error('添加训练数据失败');
  }
}

/**
 * 生成后续问题
 */
export async function generateFollowupQuestionsAction(id: string): Promise<QuestionListResponse> {
  try {
    // 检查ID是否有效
    if (!id) {
      return { type: "question_list", questions: [], header: "" };
    }
    
    // 尝试获取后续问题
    const response = await api.generateFollowupQuestions(id);
    return response;
  } catch (error) {
    console.error('生成后续问题失败:', error);
    // 返回空数组而不是抛出错误，避免中断主流程
    return { type: "question_list", questions: [], header: "" };
  }
}

/**
 * 加载已存问题
 */
export async function loadQuestionAction(id: string): Promise<QuestionCacheResponse> {
  try {
    return await api.loadQuestion(id);
  } catch (error) {
    console.error('加载问题失败:', error);
    throw new Error('加载问题失败');
  }
}

/**
 * 获取问题历史
 */
export async function getQuestionHistoryAction(): Promise<QuestionHistoryResponse> {
  try {
    return await api.getQuestionHistory();
  } catch (error) {
    console.error('获取问题历史失败:', error);
    throw new Error('获取问题历史失败');
  }
}

/**
 * 新建对话
 */
export async function createNewConversationAction(): Promise<{success: boolean}> {
  try {
    const result = await api.createNewConversation();
    // 重新验证主页面缓存
    revalidatePath('/');
    return result;
  } catch (error) {
    console.error('新建对话失败:', error);
    throw new Error('新建对话失败');
  }
}

/**
 * 获取示例问题
 */
export async function generateExampleQuestionsAction(): Promise<QuestionListResponse> {
  try {
    return await api.generateExampleQuestions();
  } catch (error) {
    console.error('获取示例问题失败:', error);
    // 返回默认的示例问题而不是抛出错误
    return {
      type: "question_list",
      questions: [
        "中国金茂的收入是多少?",
        "各个项目的收入排名是什么?",
        "去年的总收入是多少?"
      ],
      header: "以下是一些您可以提问的问题:"
    };
  }
}
