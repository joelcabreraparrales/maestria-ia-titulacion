export class SchemaNotFoundException extends Error {
  constructor(schemaName?: string) {
    super(schemaName ? `Schema '${schemaName}' no encontrado o sin tablas` : "Schema de base de datos no encontrado");
    this.name = "SchemaNotFoundException";
  }
}
