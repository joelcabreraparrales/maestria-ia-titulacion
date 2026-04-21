import { QueryExecutionResult } from "../interfaces/conversation.interface";

export abstract class QueryExecutor {
  public abstract execute(sql: string): Promise<QueryExecutionResult>;
}
