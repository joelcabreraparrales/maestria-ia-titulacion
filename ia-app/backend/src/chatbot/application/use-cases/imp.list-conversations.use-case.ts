import { ListConversationsUseCase } from "../../domain/classes/list-conversations.use-case.class";
import { ChatbotRepository } from "../../domain/classes/chatbot.repository.class";
import { ConversationEntity } from "../../domain/entities/conversation.entity";

export class ImpListConversationsUseCase extends ListConversationsUseCase {
  constructor(private readonly repository: ChatbotRepository) {
    super();
  }

  public async list(credentialId: number): Promise<ConversationEntity[]> {
    return this.repository.listConversations(credentialId);
  }
}
