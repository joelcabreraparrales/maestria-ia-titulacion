export class ConversationNotFoundException extends Error {
  constructor() {
    super("Conversación no encontrada");
    this.name = "ConversationNotFoundException";
  }
}
