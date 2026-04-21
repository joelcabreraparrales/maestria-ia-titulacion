import { Router } from "express";
import { ChatbotController } from "../controllers/chatbot.controller";
import { validateTokenMiddleware } from "../../../auth/presentation/middlewares/validate.token.middleware";

export function createChatbotRouter(controller: ChatbotController): Router {
  const router = Router();

  router.post("/query", validateTokenMiddleware, controller.query);
  router.post("/query-stream", validateTokenMiddleware, controller.queryStream);
  router.get("/conversations", validateTokenMiddleware, controller.listConversations);
  router.get("/conversations/:id", validateTokenMiddleware, controller.getConversation);
  router.delete("/conversations/:id", validateTokenMiddleware, controller.deleteConversation);

  return router;
}
