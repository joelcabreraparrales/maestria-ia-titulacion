import { ChartItem } from "../../domain/interfaces/chart-config.interface";

export interface QueryResponseDTO {
  conversationCode: string;
  messageCode: string;
  userQuery: string;
  sqlGenerated: string;
  explanation: string;
  data: Record<string, unknown>[];
  rowCount: number;
  executionMs: number;
  charts: ChartItem[];
  recommendedChart: number;
  suggestedFollowUps: string[];
}

export interface ConversationSummaryDTO {
  conversationCode: string;
  title: string | null;
  createdAt: Date;
}

export interface MessageDTO {
  messageCode: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ConversationDetailDTO {
  conversationCode: string;
  title: string | null;
  createdAt: Date;
  messages: MessageDTO[];
}
