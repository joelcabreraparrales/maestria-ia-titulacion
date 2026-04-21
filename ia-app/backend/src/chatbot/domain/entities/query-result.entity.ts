import { QueryResultProps } from "../interfaces/conversation.interface";
import { ChartConfig } from "../interfaces/chart-config.interface";

export class QueryResultEntity {
  private readonly queryResultId: number;
  private readonly messageId: number;
  private readonly sqlGenerated: string;
  private readonly resultData: Record<string, unknown>[];
  private readonly chartConfig: ChartConfig | null;
  private readonly rowCount: number;
  private readonly executionMs: number;
  private readonly errorMessage: string | null;
  private readonly createdAt: Date;

  constructor(props: QueryResultProps) {
    this.queryResultId = props.queryResultId;
    this.messageId = props.messageId;
    this.sqlGenerated = props.sqlGenerated;
    this.resultData = props.resultData;
    this.chartConfig = props.chartConfig;
    this.rowCount = props.rowCount;
    this.executionMs = props.executionMs;
    this.errorMessage = props.errorMessage;
    this.createdAt = props.createdAt;
  }

  public getId(): number { return this.queryResultId; }
  public getMessageId(): number { return this.messageId; }
  public getSql(): string { return this.sqlGenerated; }
  public getData(): Record<string, unknown>[] { return this.resultData; }
  public getChartConfig(): ChartConfig | null { return this.chartConfig; }
  public getRowCount(): number { return this.rowCount; }
  public getExecutionMs(): number { return this.executionMs; }
  public getErrorMessage(): string | null { return this.errorMessage; }
  public getCreatedAt(): Date { return this.createdAt; }
}
