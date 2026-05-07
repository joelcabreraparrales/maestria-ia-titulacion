import { GetConversationUseCase } from "../../domain/classes/get-conversation.use-case.class";
import { ChatbotRepository } from "../../domain/classes/chatbot.repository.class";
import { ConversationEntity } from "../../domain/entities/conversation.entity";

export class ImpGetConversationUseCase extends GetConversationUseCase {
  constructor(private readonly repository: ChatbotRepository) {
    super();
  }

  public async get(conversationCode: string, credentialId: number): Promise<ConversationEntity> {
    return this.repository.getConversationWithMessages(conversationCode, credentialId);
  }
}
