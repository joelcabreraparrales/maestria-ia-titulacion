import { Router } from "express";
import { ChatbotController } from "../controllers/chatbot.controller";
import { validateTokenMiddleware } from "../../../auth/presentation/middlewares/validate.token.middleware";
import { queryValidator } from "../middlewares/query.validator";
import { validateRequest } from "../../../shared/middlewares/validate.request.middleware";

export function createChatbotRouter(controller: ChatbotController): Router {
  const router = Router();

  router.post("/query", validateTokenMiddleware, queryValidator, validateRequest, controller.query);
  router.post("/query-stream", validateTokenMiddleware, queryValidator, validateRequest, controller.queryStream);
  router.get("/conversations", validateTokenMiddleware, controller.listConversations);
  router.get("/conversations/:id", validateTokenMiddleware, controller.getConversation);
  router.delete("/conversations/:id", validateTokenMiddleware, controller.deleteConversation);

  return router;
}
