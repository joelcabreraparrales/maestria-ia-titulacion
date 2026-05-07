import { Router } from "express";
import { Pool } from "pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { EnvAdapter } from "../plugins/env/env.adapter";

import { PostgreProfileDatasource } from "./infrastructure/datasources/postgre.profile.datasource";
import { ImpProfileRepository } from "./infrastructure/repositories/imp.profile.repository";
import { ImpGetProfileUseCase } from "./application/use-cases/imp.get-profile.use-case";
import { ImpUpdateProfileUseCase } from "./application/use-cases/imp.update-profile.use-case";
import { ProfileService } from "./application/profile.service";
import { ProfileController } from "./presentation/controllers/profile.controller";
import { createProfileRouter } from "./presentation/routes/profile.router";

function buildPrismaClient(): PrismaClient {
  const env = new EnvAdapter();
  const pool = new Pool({ connectionString: env.get("DATABASE_URL") });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export function buildProfileRouter(): Router {
  const db = buildPrismaClient();

  const datasource = new PostgreProfileDatasource(db);
  const repository = new ImpProfileRepository(datasource);

  const getProfileUseCase = new ImpGetProfileUseCase(repository);
  const updateProfileUseCase = new ImpUpdateProfileUseCase(repository);

  const service = new ProfileService(getProfileUseCase, updateProfileUseCase);
  const controller = new ProfileController(service);

  return createProfileRouter(controller);
}
