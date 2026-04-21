export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignTable?: string;
}

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
}

export interface SchemaInfo {
  schemaNames: string[];   // uno o varios schemas consultados
  tables: TableInfo[];     // todas las tablas de todos los schemas; cada una lleva su schema en TableInfo.schema
}
