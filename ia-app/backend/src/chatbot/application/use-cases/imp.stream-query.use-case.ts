import { ProcessQueryInput, ProcessQueryOutput } from "../../domain/classes/process-query.use-case.class";
import { QueryExecutor } from "../../domain/classes/query-executor.class";
import { SchemaInspector } from "../../domain/classes/schema-inspector.class";
import { ChatbotRepository } from "../../domain/classes/chatbot.repository.class";
import { LlmCoderService } from "../../../plugins/llm/llm.coder.service";
import { LlmAnalizerService } from "../../../plugins/llm/llm.analizer.service";

const DEFAULT_SCHEMAS: string[] = (process.env.ERP_TARGET_SCHEMAS ?? "public")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export interface StreamQueryCallbacks {
  onThinking(step: string, message: string): void;
  onSqlReady(sqlArray: string[]): void;
  onComplete(result: ProcessQueryOutput): void;
  onError(error: Error): void;
}

export class ImpStreamQueryUseCase {
  constructor(
    private readonly sqlLlm: LlmCoderService,
    private readonly analysisLlm: LlmAnalizerService,
    private readonly schemaInspector: SchemaInspector,
    private readonly queryExecutor: QueryExecutor,
    private readonly repository: ChatbotRepository,
  ) {}

  public async process(input: ProcessQueryInput, callbacks: StreamQueryCallbacks): Promise<void> {
    try {
      const targetSchemas = input.targetSchemas?.length ? input.targetSchemas : DEFAULT_SCHEMAS;

      callbacks.onThinking("schema", "Preparando el análisis de tus datos...");

      // 1. Obtener o crear conversación
      const conversation = await this.repository.getOrCreateConversation(
        input.credentialId,
        input.username,
        input.conversationCode,
      );

      if (!conversation.getTitle()) {
        const title = input.query.slice(0, 120);
        await this.repository.updateTitle(conversation.getCode(), title);
        conversation.setTitle(title);
      }

      // 2. Guardar mensaje del usuario y obtener historial
      const userMessage = await this.repository.saveUserMessage(conversation.getId(), input.query);
      const history = await this.repository.getHistory(conversation.getId());

      // 3. Obtener esquema (cacheado)
      const schema = await this.schemaInspector.getSchemas(targetSchemas);

      callbacks.onThinking("sql_generating", "Entendiendo tu pregunta y buscando los datos...");

      // 4. Generar SQL
      const sqlQueries = await this.sqlLlm.generateSql({
        schema,
        userQuery: input.query,
        conversationHistory: history.slice(0, -1),
      });

      callbacks.onSqlReady(sqlQueries);
      callbacks.onThinking("executing", "Consultando la información, un momento...");

      // 5. Ejecutar queries en paralelo
      const queryResults = await Promise.allSettled(
        sqlQueries.map(sql => this.queryExecutor.execute(sql))
      );

      let combinedRows: Record<string, unknown>[] = [];
      let totalRowCount = 0;
      let totalExecutionMs = 0;
      const executedSqls: string[] = [];

      for (let i = 0; i < queryResults.length; i++) {
        const r = queryResults[i];
        if (r.status === "fulfilled") {
          combinedRows = combinedRows.concat(r.value.rows as Record<string, unknown>[]);
          totalRowCount += r.value.rowCount;
          totalExecutionMs += r.value.executionMs;
          executedSqls.push(sqlQueries[i]);
        } else {
          const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
          console.warn(`[CHATBOT STREAM] Query failed, skipping: ${msg}`);
        }
      }

      if (executedSqls.length === 0) {
        throw new Error("Ninguna de las consultas SQL generadas pudo ejecutarse correctamente.");
      }

      const safeSql = executedSqls
        .map((s) => s.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim())
        .join(" --- ");

      callbacks.onThinking("analyzing", "Interpretando los resultados y preparando tus gráficas...");

      // 6. Generar análisis + charts
      const columns = combinedRows.length > 0 ? Object.keys(combinedRows[0]) : [];
      const analysis = await this.analysisLlm.generateAnalysis({
        userQuery: input.query,
        columns,
        dataSample: combinedRows,
        rowCount: totalRowCount,
      });

      // 7. Persistir resultado
      const assistantMessage = await this.repository.saveAssistantMessage(
        conversation.getId(),
        analysis.explanation,
      );

      const recommendedConfig = analysis.charts[analysis.recommendedChart]?.chartConfig
        ?? analysis.charts[0]?.chartConfig
        ?? null;

      await this.repository.saveQueryResult({
        messageId: assistantMessage.getId(),
        sqlGenerated: safeSql,
        resultData: combinedRows,
        chartConfig: recommendedConfig,
        rowCount: totalRowCount,
        executionMs: totalExecutionMs,
      });

      const queryResult = {
        getId: () => 0,
        getMessageId: () => assistantMessage.getId(),
        getSql: () => safeSql,
        getData: () => combinedRows,
        getChartConfig: () => recommendedConfig,
        getRowCount: () => totalRowCount,
        getExecutionMs: () => totalExecutionMs,
        getErrorMessage: () => null,
        getCreatedAt: () => new Date(),
      } as unknown as import("../../domain/entities/query-result.entity").QueryResultEntity;

      callbacks.onComplete({
        conversationCode: conversation.getCode(),
        messageCode: userMessage.getCode(),
        userQuery: input.query,
        sqlGenerated: safeSql,
        explanation: analysis.explanation,
        data: combinedRows,
        rowCount: totalRowCount,
        executionMs: totalExecutionMs,
        charts: analysis.charts,
        recommendedChart: analysis.recommendedChart,
        suggestedFollowUps: analysis.suggestedFollowUps,
        conversation,
        queryResult,
      });
    } catch (err) {
      callbacks.onError(err instanceof Error ? err : new Error(String(err)));
    }
  }
}
