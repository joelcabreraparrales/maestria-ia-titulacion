export abstract class LlmService {
  public abstract generateContent(systemPrompt: string, userPrompt: string): Promise<string>;
}
