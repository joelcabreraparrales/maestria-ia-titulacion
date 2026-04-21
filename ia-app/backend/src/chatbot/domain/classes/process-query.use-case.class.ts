import { ConversationEntity } from "../entities/conversation.entity";
import { QueryResultEntity } from "../entities/query-result.entity";

export interface ProcessQueryInput {
  credentialId: number;
  username: string;
  query: string;
  conversationCode?: string;
  targetSchemas?: string[];
}

export interface ProcessQueryOutput {
  conversationCode: string;
  messageCode: string;
  userQuery: string;
  sqlGenerated: string;
  explanation: string;
  data: Record<string, unknown>[];
  rowCount: number;
  executionMs: number;
  charts: import("../interfaces/chart-config.interface").ChartItem[];
  recommendedChart: number;
  suggestedFollowUps: string[];
  conversation: ConversationEntity;
  queryResult: QueryResultEntity;
}

export abstract class ProcessQueryUseCase {
  public abstract process(input: ProcessQueryInput): Promise<ProcessQueryOutput>;
}
