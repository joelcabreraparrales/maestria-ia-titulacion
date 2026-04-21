import { AnalysisResult } from "../interfaces/chart-config.interface";
import { GenerateAnalysisParams, GenerateSqlParams } from "../interfaces/conversation.interface";

export abstract class LlmService {
  public abstract generateSql(params: GenerateSqlParams): Promise<string[]>;
  public abstract generateAnalysis(params: GenerateAnalysisParams): Promise<AnalysisResult>;
}
