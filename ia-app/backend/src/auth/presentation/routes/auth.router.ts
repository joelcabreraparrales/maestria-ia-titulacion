import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateTokenMiddleware } from "../middlewares/validate.token.middleware";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post("/login", controller.login);
  router.post("/logout", validateTokenMiddleware, controller.logout);
  router.post("/refresh", validateTokenMiddleware, controller.refresh);

  return router;
}
