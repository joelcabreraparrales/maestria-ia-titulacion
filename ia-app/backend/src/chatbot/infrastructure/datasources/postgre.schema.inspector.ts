import { Pool } from "pg";
import { SchemaInspector } from "../../domain/classes/schema-inspector.class";
import { SchemaInfo, TableInfo, ColumnInfo } from "../../domain/interfaces/schema-info.interface";
import { SchemaNotFoundException } from "../../domain/exceptions/schema-not-found.exception";

interface SchemaRow {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
  is_foreign_key: boolean;
  foreign_table_name: string | null;
}

// Usa pg_catalog en lugar de information_schema: 10-50x más rápida.
// pg_catalog accede directamente a los catálogos internos de PostgreSQL
// sin las vistas de compatibilidad SQL-standard que son costosas.
const SCHEMA_QUERY = `
  SELECT
    n.nspname                                      AS table_schema,
    t.relname                                      AS table_name,
    a.attname                                      AS column_name,
    pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
    NOT a.attnotnull                               AS is_nullable,
    COALESCE(pk.is_pk, false)                      AS is_primary_key,
    COALESCE(fk.is_fk, false)                      AS is_foreign_key,
    fk.foreign_table_name
  FROM pg_catalog.pg_class      t
  JOIN pg_catalog.pg_namespace  n  ON n.oid = t.relnamespace
  JOIN pg_catalog.pg_attribute  a  ON a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped
  -- Primary keys
  LEFT JOIN (
    SELECT
      ix.indrelid  AS table_oid,
      a2.attnum    AS attnum,
      true         AS is_pk
    FROM pg_catalog.pg_index     ix
    JOIN pg_catalog.pg_attribute a2 ON a2.attrelid = ix.indrelid
                                    AND a2.attnum   = ANY(ix.indkey)
    WHERE ix.indisprimary
  ) pk ON pk.table_oid = t.oid AND pk.attnum = a.attnum
  -- Foreign keys
  LEFT JOIN (
    SELECT
      co.conrelid                                   AS table_oid,
      UNNEST(co.conkey)                             AS attnum,
      ft.relname                                    AS foreign_table_name,
      true                                          AS is_fk
    FROM pg_catalog.pg_constraint co
    JOIN pg_catalog.pg_class      ft ON ft.oid = co.confrelid
    WHERE co.contype = 'f'
  ) fk ON fk.table_oid = t.oid AND fk.attnum = a.attnum
  WHERE n.nspname = ANY($1::text[])
    AND t.relkind = 'r'
  ORDER BY n.nspname, t.relname, a.attnum;
`;

export class PostgreSchemaInspector extends SchemaInspector {
  private readonly cache = new Map<string, { data: SchemaInfo; expiresAt: number }>();
  private readonly cacheTtlMs: number;

  constructor(private readonly pool: Pool) {
    super();
    this.cacheTtlMs = Number(process.env.SCHEMA_CACHE_TTL_SECONDS ?? "300") * 1000;
  }

  public async getSchemas(schemaNames: string[]): Promise<SchemaInfo> {
    if (schemaNames.length === 0) {
      throw new SchemaNotFoundException("No se especificó ningún schema");
    }

    // Clave de caché: schemas ordenados para que el orden no importe
    const cacheKey = schemaNames.slice().sort().join(",");
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const result = await this.pool.query<SchemaRow>(SCHEMA_QUERY, [schemaNames]);

    if (result.rows.length === 0) {
      throw new SchemaNotFoundException(schemaNames.join(", "));
    }

    // Clave compuesta schema.tabla para soportar mismo nombre en distintos schemas
    const tablesMap = new Map<string, TableInfo>();

    for (const row of result.rows) {
      const tableKey = `${row.table_schema}.${row.table_name}`;

      if (!tablesMap.has(tableKey)) {
        tablesMap.set(tableKey, {
          name: row.table_name,
          schema: row.table_schema,
          columns: [],
        });
      }

      const column: ColumnInfo = {
        name: row.column_name,
        type: row.data_type,
        nullable: Boolean(row.is_nullable),
        isPrimaryKey: Boolean(row.is_primary_key),
        isForeignKey: Boolean(row.is_foreign_key),
        foreignTable: row.foreign_table_name ?? undefined,
      };

      tablesMap.get(tableKey)!.columns.push(column);
    }

    const schemaInfo: SchemaInfo = {
      schemaNames,
      tables: Array.from(tablesMap.values()),
    };

    this.cache.set(cacheKey, { data: schemaInfo, expiresAt: Date.now() + this.cacheTtlMs });

    return schemaInfo;
  }
}
