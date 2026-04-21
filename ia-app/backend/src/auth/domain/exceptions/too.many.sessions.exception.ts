export class TooManySessionsException extends Error {
  constructor() {
    super("Se ha alcanzado el límite de 5 sesiones activas");
    this.name = "TooManySessionsException";
  }
}
