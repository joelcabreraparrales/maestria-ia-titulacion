import { SaveQueryResultParams } from "../interfaces/conversation.interface";
import { ConversationEntity } from "../entities/conversation.entity";
import { MessageEntity } from "../entities/message.entity";

export abstract class ChatbotRepository {
  public abstract getOrCreateConversation(credentialId: number, username: string, conversationCode?: string): Promise<ConversationEntity>;
  public abstract updateTitle(conversationCode: string, title: string): Promise<void>;
  public abstract getConversationWithMessages(conversationCode: string, credentialId: number): Promise<ConversationEntity>;
  public abstract listConversations(credentialId: number): Promise<ConversationEntity[]>;
  public abstract deleteConversation(conversationCode: string, credentialId: number): Promise<void>;
  public abstract saveUserMessage(conversationId: number, content: string): Promise<MessageEntity>;
  public abstract saveAssistantMessage(conversationId: number, content: string): Promise<MessageEntity>;
  public abstract saveQueryResult(params: SaveQueryResultParams): Promise<void>;
  public abstract getHistory(conversationId: number): Promise<Array<{ role: "user" | "assistant"; content: string }>>;
}
