export abstract class LlmService {
  public abstract generateContent(prompt: string, content: string): Promise<string>;
}
