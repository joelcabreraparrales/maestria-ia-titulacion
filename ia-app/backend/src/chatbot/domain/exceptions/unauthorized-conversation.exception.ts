export class UnauthorizedConversationAccessException extends Error {
  constructor() {
    super("No tienes permiso para acceder a esta conversación");
    this.name = "UnauthorizedConversationAccessException";
  }
}
