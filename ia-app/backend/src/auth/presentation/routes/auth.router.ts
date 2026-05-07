import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { validateTokenMiddleware } from "../middlewares/validate.token.middleware";
import { authRateLimit } from "../../../plugins/rate-limit/rate.limit.plugin";
import { loginValidator } from "../middlewares/login.validator";
import { registerValidator } from "../middlewares/register.validator";
import { validateRequest } from "../../../shared/middlewares/validate.request.middleware";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post("/login", authRateLimit, loginValidator, validateRequest, controller.login);
  router.post("/logout", validateTokenMiddleware, controller.logout);
  router.post("/refresh", validateTokenMiddleware, controller.refresh);
  router.post("/signup", registerValidator, validateRequest, controller.register);

  return router;
}
