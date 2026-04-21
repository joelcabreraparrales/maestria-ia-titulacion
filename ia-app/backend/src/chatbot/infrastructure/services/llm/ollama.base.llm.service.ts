import { LlmService } from "../../../domain/classes/llm.service.class";
import { LlmErrorException } from "../../../domain/exceptions/llm-error.exception";
import { SchemaInfo, TableInfo } from "../../../domain/interfaces/schema-info.interface";

interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream: false;
  format?: "json";
  options?: {
    temperature?: number;
    num_predict?: number; // tokens que el modelo puede GENERAR (output)
    num_ctx?: number;     // ventana de contexto total: input + output
  };
}

interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
    thinking?: string; // Qwen3 y otros modelos con "thinking mode" separan razonamiento de respuesta
  };
  done: boolean;
}

// Número máximo de tablas a incluir en el prompt.
// Con AdventureWorks (~50 tablas) pasar todo el DDL supera los 8000 tokens.
// Filtrando a las más relevantes se reduce a ~3000-4000 tokens.
const MAX_TABLES_IN_PROMPT = 25;

export abstract class OllamaBaseLlmService extends LlmService {
  protected readonly baseUrl: string;
  protected readonly timeoutMs: number;
  protected readonly numCtx: number;

  constructor(protected readonly model: string) {
    super();
    this.baseUrl   = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    this.timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS ?? "120000");
    this.numCtx    = Number(process.env.OLLAMA_NUM_CTX ?? "16384");
  }

  // ── Ollama call ──────────────────────────────────────────────────────────

  private static readonly MAX_ATTEMPTS = 3;

  protected async callOllama(
    messages: OllamaMessage[],
    options?: { format?: "json"; temperature?: number; maxTokens?: number },
    attempt = 1,
  ): Promise<string> {
    const body: OllamaChatRequest = {
      model: this.model,
      messages,
      stream: false,
      options: {
        temperature: options?.temperature ?? 0.1,
        num_predict: options?.maxTokens ?? 2048,
        num_ctx:     this.numCtx,
      },
    };

    if (options?.format === "json") {
      body.format = "json";
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Reintento en errores de red (timeout, conexión rechazada)
      if (attempt < OllamaBaseLlmService.MAX_ATTEMPTS) {
        const delay = attempt * 4000;
        console.warn(`[OLLAMA] Error de conexión (intento ${attempt}/${OllamaBaseLlmService.MAX_ATTEMPTS}), reintentando en ${delay / 1000}s... (${msg})`);
        await new Promise(r => setTimeout(r, delay));
        return this.callOllama(messages, options, attempt + 1);
      }
      throw new LlmErrorException(`No se pudo conectar con Ollama (${this.baseUrl}): ${msg}`);
    }

    if (!response.ok) {
      throw new LlmErrorException(`Ollama respondió con status ${response.status}`);
    }

    const data = (await response.json()) as OllamaChatResponse;
    const content = data?.message?.content?.trim() ?? "";

    // Respuesta vacía: ocurre con modelos thinking (ej. Qwen3) cuando el modelo
    // genera solo el bloque <think>...</think> y no escribe la respuesta final.
    if (!content) {
      if (data?.message?.thinking) {
        console.warn(`[OLLAMA] Modelo generó razonamiento pero omitió la respuesta final (intento ${attempt}/${OllamaBaseLlmService.MAX_ATTEMPTS}).`);
      } else {
        console.warn(`[OLLAMA] Respuesta vacía del modelo (intento ${attempt}/${OllamaBaseLlmService.MAX_ATTEMPTS}).`);
      }

      if (attempt < OllamaBaseLlmService.MAX_ATTEMPTS) {
        const delay = attempt * 4000;
        console.warn(`[OLLAMA] Reintentando en ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        return this.callOllama(messages, options, attempt + 1);
      }

      throw new LlmErrorException(
        `El modelo no generó respuesta después de ${OllamaBaseLlmService.MAX_ATTEMPTS} intentos. ` +
        `Intenta reformular la pregunta o verifica que Ollama esté funcionando correctamente.`,
      );
    }

    return content;
  }

  // ── Schema helpers compartidos ───────────────────────────────────────────

  /**
   * Filtra el schema a las tablas más relevantes para la consulta del usuario.
   * Evita mandar 50 tablas cuando la consulta solo necesita 3-5.
   *
   * Scoring por tabla:
   *  +3  nombre de tabla aparece en la query
   *  +1  nombre de columna aparece en la query
   *  +1  bonus por cada FK que apunta a una tabla ya seleccionada (cohesión)
   *
   * Siempre se agregan las tablas referenciadas por FK de las tablas seleccionadas
   * para que los JOINs sean posibles.
   */
  protected filterRelevantTables(schema: SchemaInfo, userQuery: string): SchemaInfo {
    if (schema.tables.length <= MAX_TABLES_IN_PROMPT) {
      return schema; // Schema pequeño: pasar todo sin filtrar
    }

    // Normalizar: quitar tildes y caracteres no ASCII antes de extraer palabras.
    // Esto permite que "productos" matchee "product" y "ventas" matchee "sales".
    const normalized = userQuery
      .normalize("NFD")                  // descomponer caracteres acentuados: á → a + ́
      .replace(/[\u0300-\u036f]/g, "")   // quitar los diacríticos
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ");

    const queryWords = new Set(
      normalized
        .split(/\s+/)
        .filter((w) => w.length > 2),
    );

    // Calcular score inicial por relevancia semántica
    const scores = new Map<string, number>();
    for (const table of schema.tables) {
      let score = 0;
      const tableLower = table.name.toLowerCase();

      // Coincidencia de nombre de tabla (alto peso)
      if (queryWords.has(tableLower)) score += 3;
      // Coincidencia parcial (ej. "sales" coincide con "salesorderheader")
      for (const word of queryWords) {
        if (tableLower.includes(word) || word.includes(tableLower)) score += 2;
      }
      // Coincidencia de nombre de columna
      for (const col of table.columns) {
        if (queryWords.has(col.name.toLowerCase())) score += 1;
      }

      scores.set(`${table.schema}.${table.name}`, score);
    }

    // Seleccionar las top MAX_TABLES_IN_PROMPT por score
    const sorted = [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX_TABLES_IN_PROMPT)
      .map(([key]) => key);

    const selectedKeys = new Set(sorted);

    // Agregar tablas referenciadas por FK para permitir JOINs
    const tableSchemaMap = new Map<string, string>();
    for (const t of schema.tables) {
      tableSchemaMap.set(t.name.toLowerCase(), t.schema);
    }

    for (const table of schema.tables) {
      const key = `${table.schema}.${table.name}`;
      if (!selectedKeys.has(key)) continue;
      for (const col of table.columns) {
        if (col.isForeignKey && col.foreignTable) {
          const fkSchema = tableSchemaMap.get(col.foreignTable.toLowerCase()) ?? table.schema;
          selectedKeys.add(`${fkSchema}.${col.foreignTable}`);
        }
      }
    }

    const filteredTables = schema.tables.filter(
      (t) => selectedKeys.has(`${t.schema}.${t.name}`),
    );

    return { schemaNames: schema.schemaNames, tables: filteredTables };
  }

  /**
   * Lista compacta schema.tabla — fácil de escanear para el modelo.
   */
  protected buildQuickReference(schema: SchemaInfo): string {
    return schema.tables
      .map((t) => `  ${t.schema}.${t.name}`)
      .join("\n");
  }

  /**
   * Referencia explícita de columnas por tabla:
   *   schema.table: col1, col2, col3, ...
   *
   * Ayuda al modelo a usar nombres exactos sin inventar convenciones.
   */
  protected buildColumnReference(schema: SchemaInfo): string {
    return schema.tables
      .map((t) => {
        const cols = t.columns.map((c) => c.name).join(", ");
        return `  ${t.schema}.${t.name}: ${cols}`;
      })
      .join("\n");
  }

  /**
   * DDL compacto con nombres de tabla calificados y FK con schema.
   */
  protected buildDdl(schema: SchemaInfo): string {
    const tableSchemaMap = new Map<string, string>();
    for (const t of schema.tables) {
      tableSchemaMap.set(t.name.toLowerCase(), t.schema);
    }

    return schema.tables
      .map((table: TableInfo) => {
        const cols = table.columns
          .map((c) => {
            const pk       = c.isPrimaryKey ? " PRIMARY KEY" : "";
            const nullable = c.nullable ? "" : " NOT NULL";
            let fk = "";
            if (c.isForeignKey && c.foreignTable) {
              const fkSchema = tableSchemaMap.get(c.foreignTable.toLowerCase()) ?? table.schema;
              fk = ` REFERENCES ${fkSchema}.${c.foreignTable}`;
            }
            return `  ${c.name} ${c.type}${nullable}${pk}${fk}`;
          })
          .join(",\n");

        return `CREATE TABLE ${table.schema}.${table.name} (\n${cols}\n);`;
      })
      .join("\n\n");
  }

  /**
   * Genera una lista explícita de todas las relaciones FK del schema en formato:
   *   schema_a.table_a (col_a) → schema_b.table_b (pk_col)
   *
   * Esto le dice al modelo exactamente cómo hacer JOIN entre tablas,
   * sin que tenga que inferirlo leyendo el DDL.
   */
  protected buildRelationships(schema: SchemaInfo): string {
    // Índice: tableName → { schema, pkColumns[] }
    const tableIndex = new Map<string, { schema: string; pkCols: string[] }>();
    for (const t of schema.tables) {
      tableIndex.set(t.name.toLowerCase(), {
        schema: t.schema,
        pkCols: t.columns.filter((c) => c.isPrimaryKey).map((c) => c.name),
      });
    }

    const lines: string[] = [];

    for (const table of schema.tables) {
      for (const col of table.columns) {
        if (!col.isForeignKey || !col.foreignTable) continue;

        const target = tableIndex.get(col.foreignTable.toLowerCase());
        if (!target) continue;

        // Intentar deducir la columna PK referenciada:
        // si hay una sola PK en la tabla destino la usamos directamente,
        // si hay varias buscamos la que tenga el mismo nombre que la FK column.
        let targetCol: string;
        if (target.pkCols.length === 1) {
          targetCol = target.pkCols[0];
        } else {
          targetCol = target.pkCols.find((pk) => pk === col.name) ?? target.pkCols[0] ?? col.name;
        }

        lines.push(
          `  ${table.schema}.${table.name}.${col.name} → ${target.schema}.${col.foreignTable}.${targetCol}`,
        );
      }
    }

    return lines.length > 0
      ? lines.join("\n")
      : "  (no foreign key relationships found)";
  }

  /**
   * Extrae una o varias consultas SQL de la respuesta del modelo.
   * El modelo puede devolver múltiples queries separadas por "---".
   * Cada query puede estar en bloque markdown o en texto libre.
   * Lanza LlmErrorException si no encuentra ningún SELECT/WITH.
   */
  protected extractSql(raw: string): string[] {
    const results: string[] = [];

    // 1. Bloques markdown ```sql ... ``` — puede haber varios
    const codeBlocks = [...raw.matchAll(/```(?:sql)?\s*([\s\S]*?)```/gi)];
    if (codeBlocks.length > 0) {
      for (const block of codeBlocks) {
        const sql = block[1].trim();
        if (sql.length > 0 && /SELECT|WITH\s/i.test(sql)) {
          results.push(sql);
        }
      }
      if (results.length > 0) return results;
    }

    // 2. Queries separadas por "---" en texto libre
    const segments = raw.split(/^---+$/m).map((s) => s.trim()).filter(Boolean);
    for (const segment of segments) {
      const upper = segment.toUpperCase();
      const selectIdx = upper.indexOf("SELECT");
      const withIdx   = upper.indexOf("WITH ");
      const start     = Math.min(
        selectIdx >= 0 ? selectIdx : Infinity,
        withIdx   >= 0 ? withIdx   : Infinity,
      );
      if (start !== Infinity) {
        results.push(segment.slice(start).trim());
      }
    }
    if (results.length > 0) return results;

    // 3. Texto libre sin separadores — extraer desde el primer SELECT/WITH
    const upper = raw.toUpperCase();
    const selectIdx = upper.indexOf("SELECT");
    const withIdx   = upper.indexOf("WITH ");
    const start     = Math.min(
      selectIdx >= 0 ? selectIdx : Infinity,
      withIdx   >= 0 ? withIdx   : Infinity,
    );
    if (start !== Infinity) return [raw.slice(start).trim()];

    // 4. Sin SQL — error descriptivo
    const preview = raw.slice(0, 200).replace(/\n/g, " ");
    throw new LlmErrorException(
      `El modelo no generó una consulta SQL válida. Respuesta recibida: "${preview}${raw.length > 200 ? "…" : ""}"`
    );
  }
}
