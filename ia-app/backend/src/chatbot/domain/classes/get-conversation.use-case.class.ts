import { ConversationEntity } from "../entities/conversation.entity";

export abstract class GetConversationUseCase {
  public abstract get(conversationCode: string, credentialId: number): Promise<ConversationEntity>;
}
