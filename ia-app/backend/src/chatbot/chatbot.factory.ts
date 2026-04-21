import { Router } from "express";
import { Pool } from "pg";
import { PrismaClient } from "../../prisma/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { LlmModel } from "./domain/enums/llm-model.enum";
import { OllamaLlmFactory } from "./infrastructure/services/llm/ollama.llm.factory";
import { SqlValidatorService } from "./infrastructure/services/sql.validator.service";
import { PostgreQueryExecutor } from "./infrastructure/services/postgre.query.executor";
import { PostgreSchemaInspector } from "./infrastructure/datasources/postgre.schema.inspector";
import { PostgreChatbotDatasource } from "./infrastructure/datasources/postgre.chatbot.datasource";
import { ImpChatbotRepository } from "./infrastructure/repositories/imp.chatbot.repository";

import { ImpProcessQueryUseCase } from "./application/use-cases/imp.process-query.use-case";
import { ImpStreamQueryUseCase } from "./application/use-cases/imp.stream-query.use-case";
import { ImpGetConversationUseCase } from "./application/use-cases/imp.get-conversation.use-case";
import { ImpListConversationsUseCase } from "./application/use-cases/imp.list-conversations.use-case";
import { ChatbotService } from "./application/chatbot.service";

import { ChatbotController } from "./presentation/controllers/chatbot.controller";
import { createChatbotRouter } from "./presentation/routes/chatbot.router";

function buildChatbotPrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function buildErpPool(): Pool {
  const connectionString = process.env.ERP_DATABASE_URL ?? process.env.DATABASE_URL;
  return new Pool({
    connectionString,
    statement_timeout: Number(process.env.ERP_QUERY_TIMEOUT_MS ?? "30000"),
  });
}

export function buildChatbotRouter(): Router {
  // — Conexiones —
  const db = buildChatbotPrismaClient();
  const erpPool = buildErpPool();

  // — Infrastructure —
  const sqlLlm = OllamaLlmFactory.create(LlmModel.SQL_CODER);
  const analysisLlm = OllamaLlmFactory.create(LlmModel.QWEN_CODER);

  const sqlValidator = new SqlValidatorService();
  const queryExecutor = new PostgreQueryExecutor(erpPool);
  const schemaInspector = new PostgreSchemaInspector(erpPool);

  const chatbotDatasource = new PostgreChatbotDatasource(db);
  const chatbotRepository = new ImpChatbotRepository(chatbotDatasource);

  // — Application —
  const processQueryUseCase = new ImpProcessQueryUseCase(
    sqlLlm,
    analysisLlm,
    schemaInspector,
    queryExecutor,
    sqlValidator,
    chatbotRepository,
  );
  const streamQueryUseCase = new ImpStreamQueryUseCase(
    sqlLlm,
    analysisLlm,
    schemaInspector,
    queryExecutor,
    chatbotRepository,
  );
  const getConversationUseCase = new ImpGetConversationUseCase(chatbotRepository);
  const listConversationsUseCase = new ImpListConversationsUseCase(chatbotRepository);

  const chatbotService = new ChatbotService(
    processQueryUseCase,
    getConversationUseCase,
    listConversationsUseCase,
    chatbotRepository,
    streamQueryUseCase,
  );

  // — Presentation —
  const controller = new ChatbotController(chatbotService);

  return createChatbotRouter(controller);
}
