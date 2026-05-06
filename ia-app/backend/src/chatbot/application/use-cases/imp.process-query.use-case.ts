import { ProcessQueryUseCase, ProcessQueryInput, ProcessQueryOutput } from "../../domain/classes/process-query.use-case.class";
import { QueryExecutor } from "../../domain/classes/query-executor.class";
import { SchemaInspector } from "../../domain/classes/schema-inspector.class";
import { ChatbotRepository } from "../../domain/classes/chatbot.repository.class";
import type { SqlValidatorService } from "../../infrastructure/services/sql.validator.service";
import { LlmCoderService } from "../../../plugins/llm/llm.coder.service";
import { LlmAnalizerService } from "../../../plugins/llm/llm.analizer.service";

const DEFAULT_SCHEMAS: string[] = (process.env.ERP_TARGET_SCHEMAS ?? "public")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

export class ImpProcessQueryUseCase extends ProcessQueryUseCase {
  constructor(
    private readonly sqlLlm: LlmCoderService,
    private readonly analysisLlm: LlmAnalizerService,
    private readonly schemaInspector: SchemaInspector,
    private readonly queryExecutor: QueryExecutor,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _sqlValidator: SqlValidatorService,
    private readonly repository: ChatbotRepository,
  ) {
    super();
  }

  public async process(input: ProcessQueryInput): Promise<ProcessQueryOutput> {
    const targetSchemas = input.targetSchemas?.length
      ? input.targetSchemas
      : DEFAULT_SCHEMAS;

    // 1. Obtener o crear conversación
    const conversation = await this.repository.getOrCreateConversation(
      input.credentialId,
      input.username,
      input.conversationCode,
    );

    // 2. Título automático desde la primera consulta
    if (!conversation.getTitle()) {
      const title = input.query.slice(0, 120);
      await this.repository.updateTitle(conversation.getCode(), title);
      conversation.setTitle(title);
    }

    // 3. Guardar mensaje del usuario
    const userMessage = await this.repository.saveUserMessage(conversation.getId(), input.query);

    // 4. Obtener historial de la conversación para contexto
    const history = await this.repository.getHistory(conversation.getId());

    // 5. Obtener esquema de la base de datos (cacheado)
    const schema = await this.schemaInspector.getSchemas(targetSchemas);

    // 6. Generar SQL con el modelo especializado (SQLCoder)
    const sqlQueries = await this.sqlLlm.generateSql({
      schema,
      userQuery: input.query,
      conversationHistory: history.slice(0, -1), // excluir el mensaje recién guardado
    });

    // 7. Ejecutar queries en paralelo y combinar resultados
    const queryResults = await Promise.allSettled(
      sqlQueries.map(sql => this.queryExecutor.execute(sql))
    );

    let combinedRows: Record<string, unknown>[] = [];
    let totalRowCount = 0;
    let totalExecutionMs = 0;
    const executedSqls: string[] = [];

    for (let i = 0; i < queryResults.length; i++) {
      const r = queryResults[i];
      if (r.status === 'fulfilled') {
        combinedRows = combinedRows.concat(r.value.rows as Record<string, unknown>[]);
        totalRowCount += r.value.rowCount;
        totalExecutionMs += r.value.executionMs;
        executedSqls.push(sqlQueries[i]);
      } else {
        const msg = r.reason instanceof Error ? r.reason.message : String(r.reason);
        console.warn(`[CHATBOT] Query failed, skipping: ${msg}`);
      }
    }

    if (executedSqls.length === 0) {
      throw new Error("Ninguna de las consultas SQL generadas pudo ejecutarse correctamente.");
    }

    const safeSql = executedSqls
      .map((s) => s.replace(/\n/g, " ").replace(/\s{2,}/g, " ").trim())
      .join(" --- ");

    // 8. Generar análisis + config de gráfico con el modelo de razonamiento (Qwen)
    const columns = combinedRows.length > 0 ? Object.keys(combinedRows[0]) : [];
    const analysis = await this.analysisLlm.generateAnalysis({
      userQuery: input.query,
      columns,
      dataSample: combinedRows,
      rowCount: totalRowCount,
    });

    // 10. Guardar mensaje del asistente
    const assistantMessage = await this.repository.saveAssistantMessage(
      conversation.getId(),
      analysis.explanation,
    );

    const recommendedConfig = analysis.charts[analysis.recommendedChart]?.chartConfig
      ?? analysis.charts[0]?.chartConfig
      ?? null;

    // 11. Guardar resultado de la query
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

    return {
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
    };
  }
}
