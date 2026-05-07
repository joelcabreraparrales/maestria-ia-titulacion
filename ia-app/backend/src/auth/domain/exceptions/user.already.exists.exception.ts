export class UserAlreadyExistsException extends Error {
  constructor() {
    super("El nombre de usuario o correo ya está registrado");
    this.name = "UserAlreadyExistsException";
  }
}
