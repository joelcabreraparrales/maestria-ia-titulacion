import { LlmModel } from "../../../domain/enums/llm-model.enum";
import { LlmService } from "../../../domain/classes/llm.service.class";
import { SqlCoderLlmService } from "./sqlcoder.llm.service";
import { QwenLlmService } from "./qwen.llm.service";

export class OllamaLlmFactory {
  public static create(model: LlmModel): LlmService {
    switch (model) {
      case LlmModel.SQL_CODER:
        return new SqlCoderLlmService(
          process.env.OLLAMA_SQL_MODEL ?? "sqlcoder:7b",
        );

      case LlmModel.QWEN_CODER:
        return new QwenLlmService(
          process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5-coder:7b",
        );

      default: {
        const _exhaustive: never = model;
        throw new Error(`Modelo LLM no soportado: ${String(_exhaustive)}`);
      }
    }
  }
}
