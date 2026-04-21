export class InactiveUserException extends Error {
  constructor() {
    super("Usuario inactivo");
    this.name = "InactiveUserException";
  }
}
