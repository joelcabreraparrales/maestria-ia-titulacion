import { ProcessQueryUseCase, ProcessQueryInput, ProcessQueryOutput } from "../domain/classes/process-query.use-case.class";
import { GetConversationUseCase } from "../domain/classes/get-conversation.use-case.class";
import { ListConversationsUseCase } from "../domain/classes/list-conversations.use-case.class";
import { ChatbotRepository } from "../domain/classes/chatbot.repository.class";
import { ConversationEntity } from "../domain/entities/conversation.entity";
import { ImpStreamQueryUseCase, StreamQueryCallbacks } from "./use-cases/imp.stream-query.use-case";

export class ChatbotService {
  constructor(
    private readonly processQuery: ProcessQueryUseCase,
    private readonly getConversation: GetConversationUseCase,
    private readonly listConversations: ListConversationsUseCase,
    private readonly repository: ChatbotRepository,
    private readonly streamQueryUseCase: ImpStreamQueryUseCase,
  ) {}

  public async query(input: ProcessQueryInput): Promise<ProcessQueryOutput> {
    return this.processQuery.process(input);
  }

  public async streamQuery(input: ProcessQueryInput, callbacks: StreamQueryCallbacks): Promise<void> {
    return this.streamQueryUseCase.process(input, callbacks);
  }

  public async getConversationHistory(conversationCode: string, credentialId: number): Promise<ConversationEntity> {
    return this.getConversation.get(conversationCode, credentialId);
  }

  public async listUserConversations(credentialId: number): Promise<ConversationEntity[]> {
    return this.listConversations.list(credentialId);
  }

  public async deleteConversation(conversationCode: string, credentialId: number): Promise<void> {
    return this.repository.deleteConversation(conversationCode, credentialId);
  }
}
