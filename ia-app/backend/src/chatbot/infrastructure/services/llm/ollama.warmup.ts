/**
 * Pre-carga los modelos Ollama en memoria al arrancar el servidor.
 * Usa keep_alive: -1 para que no se descarguen automáticamente.
 *
 * Si Ollama no está disponible, solo logea un warning —
 * no bloquea el inicio del servidor.
 */
export async function warmUpOllamaModels(): Promise<void> {
  const baseUrl   = process.env.OLLAMA_BASE_URL   ?? "http://localhost:11434";
  const sqlModel  = process.env.OLLAMA_SQL_MODEL  ?? "qwen3.5:397b-cloud";
  const chatModel = process.env.OLLAMA_CHAT_MODEL ?? "qwen2.5-coder:7b";

  const load = async (model: string): Promise<void> => {
    try {
      console.log(`[OLLAMA] Cargando modelo: ${model}...`);

      const res = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages:   [],
          keep_alive: -1,   // mantener en memoria indefinidamente
        }),
        signal: AbortSignal.timeout(120_000), // 2 min para la carga inicial
      });

      if (res.ok) {
        console.log(`[OLLAMA] Modelo listo: ${model}`);
      } else {
        console.warn(`[OLLAMA] Respuesta inesperada al cargar ${model}: HTTP ${res.status}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[OLLAMA] No se pudo pre-cargar ${model}: ${msg}`);
    }
  };

  // Cargar ambos modelos en paralelo, sin bloquear el servidor
  void Promise.all([load(sqlModel), load(chatModel)]);
}
