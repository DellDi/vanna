/**
 * 定义系统中使用的类型
 */

// 基本响应类型
export interface BaseResponse {
  type: string;
}

// 问题列表响应
export interface QuestionListResponse extends BaseResponse {
  type: "question_list";
  questions: string[];
  header: string;
  id?: string;
}

// SQL生成响应
export interface GenerateSQLResponse extends BaseResponse {
  type: "sql";
  id: string;
  text: string;
}

// 数据框响应
export interface DataFrameResponse extends BaseResponse {
  type: "df";
  id: string;
  df: string; // JSON格式的数据框
}

// Plotly图表响应
export interface PlotlyFigureResponse extends BaseResponse {
  type: "plotly_figure";
  id: string;
  fig: string; // Plotly图表JSON
}

// 问题缓存响应
export interface QuestionCacheResponse extends BaseResponse {
  type: "question_cache";
  id: string;
  question: string;
  sql: string;
  df: string;
  fig: string;
  followup_questions: string[];
}

// 问题历史响应
export interface QuestionHistoryResponse extends BaseResponse {
  type: "question_history";
  questions: Array<{id: string; question: string}>;
}

// 训练数据类型
export interface TrainingData {
  id: string | number;
  question: string;
  content: string;
  type: "sql" | "documentation" | "ddl";
}

// 训练请求类型
export interface TrainRequest {
  question?: string;
  sql?: string;
  ddl?: string;
  documentation?: string;
}

// 消息类型
export interface Message {
  type: "user" | "assistant";
  content: string;
}
