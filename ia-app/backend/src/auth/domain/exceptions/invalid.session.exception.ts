export class InvalidSessionException extends Error {
  constructor() {
    super("Sesión inválida o expirada");
    this.name = "InvalidSessionException";
  }
}
