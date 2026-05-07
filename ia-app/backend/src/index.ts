import "dotenv/config";
import { EnvAdapter } from "./plugins/env/env.adapter";
import { ExpressServer } from "./plugins/express.adapter";
import { ServerProps } from "./shared/interfaces/server-props.interface";

const envService = new EnvAdapter();

try {
  envService.get("DATABASE_URL");
  envService.get("JWT_SECRET");
  envService.get("HF_API_KEY");
  envService.get("HF_IA_MODEL");
  envService.get("ERP_DATABASE_URL");
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[FATAL] Variable de entorno requerida no definida: ${message}`);
  process.exit(1);
}

if (envService.get("JWT_SECRET") === "change_this_secret_in_production") {
  console.warn("[WARN] JWT_SECRET tiene el valor por defecto. Cámbialo antes de producción.");
}

const serverProps: ServerProps = {
  port: envService.getInt("PORT", 3000),
  jsonSpaces: 2,
};

const server = new ExpressServer(serverProps);
server.start();
