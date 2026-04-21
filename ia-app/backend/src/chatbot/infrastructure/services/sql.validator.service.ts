import { InvalidSqlException } from "../../domain/exceptions/invalid-sql.exception";

const MAX_LIMIT = 5000;
const DEFAULT_LIMIT = 1000;

const FORBIDDEN_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "TRUNCATE",
  "ALTER",
  "CREATE",
  "GRANT",
  "REVOKE",
  "EXECUTE",
  "EXEC",
  "XP_",
  "SP_",
  "INTO OUTFILE",
  "LOAD_FILE",
  "LOAD DATA",
  "COPY ",
  "\\COPY",
];

export interface SqlValidationResult {
  sql: string;
  wasLimitAdded: boolean;
}

export class SqlValidatorService {
  public validate(rawSql: string): SqlValidationResult {
    if (!rawSql || rawSql.trim().length === 0) {
      throw new InvalidSqlException("La consulta está vacía");
    }

    let sql = rawSql.trim();
    const normalized = sql.toUpperCase();

    if (!normalized.startsWith("SELECT") && !normalized.startsWith("WITH")) {
      throw new InvalidSqlException("Solo se permiten consultas SELECT o CTE (WITH ... SELECT)");
    }

    for (const kw of FORBIDDEN_KEYWORDS) {
      if (normalized.includes(kw)) {
        throw new InvalidSqlException(`Operación no permitida detectada: ${kw}`);
      }
    }

    // Detectar múltiples statements (;)
    const stripped = sql.replace(/'[^']*'/g, "''"); // ignorar literales
    if ((stripped.match(/;/g) ?? []).length > 1) {
      throw new InvalidSqlException("No se permiten múltiples sentencias SQL");
    }

    // Limpiar punto y coma final si existe
    sql = sql.replace(/;\s*$/, "");

    const hasLimit = /\bLIMIT\s+\d+/i.test(sql);

    if (!hasLimit) {
      return { sql: `${sql} LIMIT ${DEFAULT_LIMIT}`, wasLimitAdded: true };
    }

    // Clamp LIMIT si supera el máximo
    const limitMatch = sql.match(/\bLIMIT\s+(\d+)/i);
    if (limitMatch && parseInt(limitMatch[1], 10) > MAX_LIMIT) {
      return {
        sql: sql.replace(/\bLIMIT\s+\d+/i, `LIMIT ${DEFAULT_LIMIT}`),
        wasLimitAdded: true,
      };
    }

    return { sql, wasLimitAdded: false };
  }
}
