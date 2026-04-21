import { Pool } from "pg";
import { QueryExecutor } from "../../domain/classes/query-executor.class";
import { QueryExecutionResult } from "../../domain/interfaces/conversation.interface";
import { QueryExecutionException } from "../../domain/exceptions/query-execution-error.exception";

export class PostgreQueryExecutor extends QueryExecutor {
  constructor(private readonly pool: Pool) {
    super();
  }

  public async execute(sql: string): Promise<QueryExecutionResult> {
    const client = await this.pool.connect();
    const start = Date.now();

    try {
      // Abrir transacción explícita en modo solo lectura
      await client.query("BEGIN");
      await client.query("SET TRANSACTION READ ONLY");

      const result = await client.query(sql);
      await client.query("COMMIT");
      const executionMs = Date.now() - start;

      return {
        rows: result.rows as Record<string, unknown>[],
        rowCount: result.rowCount ?? result.rows.length,
        executionMs,
      };
    } catch (err) {
      await client.query("ROLLBACK").catch(() => undefined);
      const msg = err instanceof Error ? err.message : String(err);
      throw new QueryExecutionException(msg);
    } finally {
      client.release();
    }
  }
}
