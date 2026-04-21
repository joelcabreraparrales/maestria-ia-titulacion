import { SaveQueryResultParams, SaveConversationParams } from "../interfaces/conversation.interface";

export abstract class ChatbotDatasource {
  public abstract createConversation(params: SaveConversationParams): Promise<Record<string, unknown>>;
  public abstract updateConversationTitle(conversationCode: string, title: string): Promise<void>;
  public abstract getConversation(conversationCode: string): Promise<Record<string, unknown> | null>;
  public abstract listConversations(credentialId: number): Promise<Record<string, unknown>[]>;
  public abstract softDeleteConversation(conversationCode: string): Promise<void>;
  public abstract saveMessage(conversationId: number, role: "user" | "assistant", content: string): Promise<Record<string, unknown>>;
  public abstract saveQueryResult(params: SaveQueryResultParams): Promise<void>;
  public abstract getMessagesByConversation(conversationId: number): Promise<Record<string, unknown>[]>;
}
