import { ChartConfig } from "./chart-config.interface";

export interface ConversationProps {
  conversationId: number;
  conversationCode: string;
  credentialId: number;
  username: string;
  title: string | null;
  isActive: boolean;
  createdAt: Date;
}

export interface MessageProps {
  messageId: number;
  messageCode: string;
  conversationId: number;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface QueryResultProps {
  queryResultId: number;
  messageId: number;
  sqlGenerated: string;
  resultData: Record<string, unknown>[];
  chartConfig: ChartConfig | null;
  rowCount: number;
  executionMs: number;
  errorMessage: string | null;
  createdAt: Date;
}

export interface SaveQueryResultParams {
  messageId: number;
  sqlGenerated: string;
  resultData: Record<string, unknown>[];
  chartConfig: ChartConfig | null;
  rowCount: number;
  executionMs: number;
  errorMessage?: string;
}

export interface SaveConversationParams {
  credentialId: number;
  username: string;
  title?: string;
}

export interface GenerateSqlParams {
  schema: import("./schema-info.interface").SchemaInfo;
  userQuery: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface GenerateAnalysisParams {
  userQuery: string;
  columns: string[];
  dataSample: Record<string, unknown>[];
  rowCount: number;
}

export interface QueryExecutionResult {
  rows: Record<string, unknown>[];
  rowCount: number;
  executionMs: number;
}
