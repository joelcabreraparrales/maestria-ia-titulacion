import { GenerateAnalysisParams } from "../../chatbot/domain/interfaces/conversation.interface";
import { AnalysisResult } from "../../chatbot/domain/interfaces/chart-config.interface";

export abstract class LlmAnalizerService {
  public abstract generateAnalysis(params: GenerateAnalysisParams): Promise<AnalysisResult>;
  protected abstract parseAnalysisResponse(raw: string): AnalysisResult;
}
