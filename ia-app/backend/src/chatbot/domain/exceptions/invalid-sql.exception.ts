export class InvalidSqlException extends Error {
  constructor(detail?: string) {
    super(detail ? `SQL inválido: ${detail}` : "El SQL generado no es válido o contiene operaciones no permitidas");
    this.name = "InvalidSqlException";
  }
}
