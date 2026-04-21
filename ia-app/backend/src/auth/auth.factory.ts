import { Router } from "express";
import { Pool } from "pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { PostgreAuthDatasource } from "./infrastructure/datasources/postgre.auth.datasource";
import { PostgreSessionDatasource } from "./infrastructure/datasources/postgre.session.datasource";
import { ImpLogService } from "./infrastructure/datasources/postgre.log.service";
import { ImpAuthRepository } from "./infrastructure/repositories/imp.auth.repository";
import { ImpSessionRepository } from "./infrastructure/repositories/imp.session.repository";

import { ImpAuthenticateUserUseCase } from "./application/imp.authenticate.user.use.case";
import { ImpGenerateSessionUseCase } from "./application/imp.generate.session.use.case";
import { ImpLogoutUseCase } from "./application/imp.logout.use.case";
import { ImpRefreshSessionUseCase } from "./application/imp.refresh.session.use.case";
import { AuthenticationService } from "./application/authentication.service";

import { BcryptHashService } from "../plugins/bcrypt/bcrypt.hash.service";
import { JwtTokenService } from "../plugins/jwt/jwt.token.service";
import { UuidCodeGeneratorService } from "../plugins/uuid/uuid.code.generator.service";
import { ImpDateManager } from "../plugins/dayjs/dayjs.plugin";

import { AuthController } from "./presentation/controllers/auth.controller";
import { createAuthRouter } from "./presentation/routes/auth.router";

function buildPrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function buildAuthRouter(): Router {
  const db = buildPrismaClient();

  const authDatasource = new PostgreAuthDatasource(db);
  const sessionDatasource = new PostgreSessionDatasource(db);
  const logService = new ImpLogService(db);

  const authRepository = new ImpAuthRepository(authDatasource);
  const sessionRepository = new ImpSessionRepository(sessionDatasource, logService);

  const hashService = new BcryptHashService();
  const tokenService = new JwtTokenService(
    process.env.JWT_SECRET!,
    process.env.JWT_EXPIRES_IN ?? "8h",
  );
  const codeGenerator = new UuidCodeGeneratorService();
  const dateManager = new ImpDateManager();

  const authenticateUserUseCase = new ImpAuthenticateUserUseCase(authRepository, hashService);
  const generateSessionUseCase = new ImpGenerateSessionUseCase(tokenService, sessionRepository, codeGenerator, dateManager);
  const logoutUseCase = new ImpLogoutUseCase(sessionRepository, logService);
  const refreshUseCase = new ImpRefreshSessionUseCase(sessionRepository, tokenService, dateManager, logService);

  const authService = new AuthenticationService(authenticateUserUseCase, generateSessionUseCase, logoutUseCase, refreshUseCase);
  const authController = new AuthController(authService);

  return createAuthRouter(authController);
}
