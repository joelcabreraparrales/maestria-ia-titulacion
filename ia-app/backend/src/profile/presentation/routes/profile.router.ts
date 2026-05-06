import { Router } from "express";
import { ProfileController } from "../controllers/profile.controller";
import { validateTokenMiddleware } from "../../../auth/presentation/middlewares/validate.token.middleware";

export function createProfileRouter(controller: ProfileController): Router {
  const router = Router();

  router.get("/me", validateTokenMiddleware, controller.getProfile);
  router.put("/me", validateTokenMiddleware, controller.updateProfile);

  return router;
}
