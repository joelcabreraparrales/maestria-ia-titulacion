import { randomUUID } from "crypto";
import { PrismaClient, Prisma } from "../../../../prisma/generated/prisma/client";
import { ChatbotDatasource } from "../../domain/classes/chatbot.datasource.class";
import { SaveQueryResultParams, SaveConversationParams } from "../../domain/interfaces/conversation.interface";

export class PostgreChatbotDatasource extends ChatbotDatasource {
  constructor(private readonly db: PrismaClient) {
    super();
  }

  public async createConversation(params: SaveConversationParams): Promise<Record<string, unknown>> {
    const row = await this.db.chatbot_conversation.create({
      data: {
        conversation_code: randomUUID(),
        credential_id: params.credentialId,
        username: params.username,
        title: params.title ?? null,
      },
    });
    return row as unknown as Record<string, unknown>;
  }

  public async updateConversationTitle(conversationCode: string, title: string): Promise<void> {
    await this.db.chatbot_conversation.update({
      where: { conversation_code: conversationCode },
      data: { title, updated_at: new Date() },
    });
  }

  public async getConversation(conversationCode: string): Promise<Record<string, unknown> | null> {
    const row = await this.db.chatbot_conversation.findUnique({
      where: { conversation_code: conversationCode },
    });
    return row as unknown as Record<string, unknown> | null;
  }

  public async listConversations(credentialId: number): Promise<Record<string, unknown>[]> {
    const rows = await this.db.chatbot_conversation.findMany({
      where: { credential_id: credentialId, is_active: true },
      orderBy: { updated_at: "desc" },
    });
    return rows as unknown as Record<string, unknown>[];
  }

  public async softDeleteConversation(conversationCode: string): Promise<void> {
    await this.db.chatbot_conversation.update({
      where: { conversation_code: conversationCode },
      data: { is_active: false, updated_at: new Date() },
    });
  }

  public async saveMessage(
    conversationId: number,
    role: "user" | "assistant",
    content: string,
  ): Promise<Record<string, unknown>> {
    const row = await this.db.chatbot_message.create({
      data: {
        message_code: randomUUID(),
        conversation_id: conversationId,
        role,
        content,
      },
    });
    return row as unknown as Record<string, unknown>;
  }

  public async saveQueryResult(params: SaveQueryResultParams): Promise<void> {
    await this.db.chatbot_query_result.create({
      data: {
        message_id: params.messageId,
        sql_generated: params.sqlGenerated,
        result_data: params.resultData as Prisma.InputJsonValue,
        chart_config: params.chartConfig
          ? (params.chartConfig as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        row_count: params.rowCount,
        execution_ms: params.executionMs,
        error_message: params.errorMessage ?? null,
      },
    });
  }

  public async getMessagesByConversation(conversationId: number): Promise<Record<string, unknown>[]> {
    const rows = await this.db.chatbot_message.findMany({
      where: { conversation_id: conversationId },
      orderBy: { created_at: "asc" },
    });
    return rows as unknown as Record<string, unknown>[];
  }
}
