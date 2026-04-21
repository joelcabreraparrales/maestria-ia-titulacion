export class QueryExecutionException extends Error {
  constructor(detail?: string) {
    super(detail ? `Error al ejecutar la consulta: ${detail}` : "Error al ejecutar la consulta en la base de datos");
    this.name = "QueryExecutionException";
  }
}
