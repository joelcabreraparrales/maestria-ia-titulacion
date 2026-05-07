import { ChatbotDatasource } from "../../domain/classes/chatbot.datasource.class";
import { ChatbotRepository } from "../../domain/classes/chatbot.repository.class";
import { ConversationEntity } from "../../domain/entities/conversation.entity";
import { MessageEntity } from "../../domain/entities/message.entity";
import { ConversationNotFoundException } from "../../domain/exceptions/conversation-not-found.exception";
import { UnauthorizedConversationAccessException } from "../../domain/exceptions/unauthorized-conversation.exception";
import { SaveQueryResultParams, ConversationProps, MessageProps } from "../../domain/interfaces/conversation.interface";

export class ImpChatbotRepository extends ChatbotRepository {
  constructor(private readonly datasource: ChatbotDatasource) {
    super();
  }

  public async getOrCreateConversation(
    credentialId: number,
    username: string,
    conversationCode?: string,
  ): Promise<ConversationEntity> {
    if (conversationCode) {
      const raw = await this.datasource.getConversation(conversationCode);
      if (!raw) throw new ConversationNotFoundException();
      const conversation = this.mapConversation(raw);
      if (conversation.getCredentialId() !== credentialId) {
        throw new UnauthorizedConversationAccessException();
      }
      return conversation;
    }
    const raw = await this.datasource.createConversation({ credentialId, username });
    return this.mapConversation(raw);
  }

  public async updateTitle(conversationCode: string, title: string): Promise<void> {
    return this.datasource.updateConversationTitle(conversationCode, title);
  }

  public async getConversationWithMessages(conversationCode: string, credentialId: number): Promise<ConversationEntity> {
    const raw = await this.datasource.getConversation(conversationCode);
    if (!raw) throw new ConversationNotFoundException();

    const conversation = this.mapConversation(raw);
    if (conversation.getCredentialId() !== credentialId) {
      throw new UnauthorizedConversationAccessException();
    }

    const messagesRaw = await this.datasource.getMessagesByConversation(conversation.getId());

    return new ConversationEntity(
      {
        conversationId: conversation.getId(),
        conversationCode: conversation.getCode(),
        credentialId: conversation.getCredentialId(),
        username: conversation.getUsername(),
        title: conversation.getTitle(),
        isActive: conversation.getIsActive(),
        createdAt: conversation.getCreatedAt(),
      },
      messagesRaw.map((m) => this.toMessageProps(m)),
    );
  }

  public async listConversations(credentialId: number): Promise<ConversationEntity[]> {
    const rows = await this.datasource.listConversations(credentialId);
    return rows.map((r) => this.mapConversation(r));
  }

  public async deleteConversation(conversationCode: string, credentialId: number): Promise<void> {
    const raw = await this.datasource.getConversation(conversationCode);
    if (!raw) throw new ConversationNotFoundException();
    const conversation = this.mapConversation(raw);
    if (conversation.getCredentialId() !== credentialId) {
      throw new UnauthorizedConversationAccessException();
    }
    return this.datasource.softDeleteConversation(conversationCode);
  }

  public async saveUserMessage(conversationId: number, content: string): Promise<MessageEntity> {
    const raw = await this.datasource.saveMessage(conversationId, "user", content);
    return new MessageEntity(this.toMessageProps(raw));
  }

  public async saveAssistantMessage(conversationId: number, content: string): Promise<MessageEntity> {
    const raw = await this.datasource.saveMessage(conversationId, "assistant", content);
    return new MessageEntity(this.toMessageProps(raw));
  }

  public async saveQueryResult(params: SaveQueryResultParams): Promise<void> {
    return this.datasource.saveQueryResult(params);
  }

  public async getHistory(conversationId: number): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
    const rows = await this.datasource.getMessagesByConversation(conversationId);
    return rows.map((r) => ({
      role: String(r["role"]) as "user" | "assistant",
      content: String(r["content"]),
    }));
  }

  private mapConversation(raw: Record<string, unknown>): ConversationEntity {
    const props: ConversationProps = {
      conversationId: Number(raw["conversation_id"]),
      conversationCode: String(raw["conversation_code"]),
      credentialId: Number(raw["credential_id"]),
      username: String(raw["username"]),
      title: raw["title"] != null ? String(raw["title"]) : null,
      isActive: Boolean(raw["is_active"]),
      createdAt: raw["created_at"] instanceof Date ? raw["created_at"] : new Date(String(raw["created_at"])),
    };
    return new ConversationEntity(props);
  }

  private toMessageProps(raw: Record<string, unknown>): MessageProps {
    return {
      messageId: Number(raw["message_id"]),
      messageCode: String(raw["message_code"]),
      conversationId: Number(raw["conversation_id"]),
      role: String(raw["role"]) as "user" | "assistant",
      content: String(raw["content"]),
      createdAt: raw["created_at"] instanceof Date ? raw["created_at"] : new Date(String(raw["created_at"])),
    };
  }
}
