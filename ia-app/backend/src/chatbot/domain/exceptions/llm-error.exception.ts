export class LlmErrorException extends Error {
  constructor(detail?: string) {
    super(detail ? `Error LLM: ${detail}` : "Error al comunicarse con el servicio de IA local");
    this.name = "LlmErrorException";
  }
}
