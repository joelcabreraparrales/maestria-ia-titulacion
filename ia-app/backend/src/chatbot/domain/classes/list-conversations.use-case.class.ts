import { ConversationEntity } from "../entities/conversation.entity";

export abstract class ListConversationsUseCase {
  public abstract list(credentialId: number): Promise<ConversationEntity[]>;
}
