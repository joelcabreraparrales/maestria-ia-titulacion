import { ServerProps } from "../shared/interfaces/server-props.interface";
import { Server } from "../shared/classes/server.class";
import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { buildAuthRouter } from "../auth/auth.factory";
import { buildChatbotRouter } from "../chatbot/chatbot.factory";
import { warmUpOllamaModels } from "../chatbot/infrastructure/services/llm/ollama.warmup";
import { errorHandlerMiddleware } from "../auth/presentation/middlewares/error.handler.middleware";
import { chatbotErrorHandlerMiddleware } from "../chatbot/presentation/middlewares/chatbot.error.handler.middleware";

export class ExpressServer extends Server {
  private readonly app: Application;
  private readonly port: number;

  constructor(private readonly serverOptions: ServerProps) {
    super();
    this.app = express();
    this.port = serverOptions.port;
    this.configServer();
    this.configMiddlewares();
    this.configRoutes();
  }

  protected configServer(): void {
    this.app.set("port", this.port);
    this.app.set("json spaces", this.serverOptions.jsonSpaces);
  }

  protected configMiddlewares(): void {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors({ origin: allowedOrigins ?? "*" }));
    this.app.use(helmet());
  }

  protected configRoutes(): void {
    this.app.use("/api/auth", buildAuthRouter());
    this.app.use("/api/chatbot", buildChatbotRouter());
    this.app.use(chatbotErrorHandlerMiddleware);
    this.app.use(errorHandlerMiddleware);
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log(`Server on port ${this.port}`);
      warmUpOllamaModels(); // pre-carga modelos en memoria, no bloquea
    });
  }
}
