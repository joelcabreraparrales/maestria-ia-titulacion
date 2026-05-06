import { InferenceClient } from "@huggingface/inference";
import { LlmProps } from "./llm.props";
import { LlmService } from "./llm.service";
import { LlmErrorException } from "../../chatbot/domain/exceptions/llm-error.exception";

export class QwenService extends LlmService {
  private model: InferenceClient;

  constructor(private readonly props: LlmProps) {
    super();
    this.model = new InferenceClient(this.props.apiKey);
  }

  public async generateContent(prompt: string, content: string): Promise<string> {
    const { model } = this.props;
    const response = await this.model.chatCompletion({
      model,
      messages: [
        { role: "system", content },
        { role: "user", content: prompt },
      ],
      max_tokens: 8192,
      temperature: 0.1,
    });

    const llmResponse = response.choices[0].message.content;
    if (!llmResponse) throw new LlmErrorException("No se pudo generar el contenido");

    return llmResponse;
  }
}
