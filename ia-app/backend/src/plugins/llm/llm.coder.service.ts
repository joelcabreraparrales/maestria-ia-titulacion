import { GenerateSqlParams } from "../../chatbot/domain/interfaces/conversation.interface";
import { SchemaInfo } from "../../chatbot/domain/interfaces/schema-info.interface";

export abstract class LlmCoderService {
  public abstract generateSql(params: GenerateSqlParams): Promise<string[]>;
  protected abstract buildRelationships(schema: SchemaInfo): string;
  protected abstract extractSql(raw: string): string[];
}
