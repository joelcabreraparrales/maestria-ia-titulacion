import "dotenv/config";
import { ExpressServer } from "./plugins/express.adapter";
import { ServerProps } from "./shared/interfaces/server-props.interface";

const REQUIRED_ENV = ["DATABASE_URL", "JWT_SECRET"] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[FATAL] Variable de entorno requerida no definida: ${key}`);
    process.exit(1);
  }
}

if (process.env.JWT_SECRET === "change_this_secret_in_production") {
  console.warn("[WARN] JWT_SECRET tiene el valor por defecto. Cámbialo antes de producción.");
}

const serverProps: ServerProps = {
  port: Number(process.env.PORT) || 3000,
  jsonSpaces: 2,
};

const server = new ExpressServer(serverProps);
server.start();
