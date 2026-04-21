import { Request, Response, NextFunction } from "express";
import { InvalidSqlException } from "../../domain/exceptions/invalid-sql.exception";
import { LlmErrorException } from "../../domain/exceptions/llm-error.exception";
import { QueryExecutionException } from "../../domain/exceptions/query-execution-error.exception";
import { SchemaNotFoundException } from "../../domain/exceptions/schema-not-found.exception";
import { ConversationNotFoundException } from "../../domain/exceptions/conversation-not-found.exception";

export function chatbotErrorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof InvalidSqlException) {
    res.status(422).json({ error: err.message, statusCode: 422 });
    return;
  }

  if (err instanceof LlmErrorException) {
    res.status(503).json({ error: err.message, statusCode: 503 });
    return;
  }

  if (err instanceof QueryExecutionException) {
    res.status(422).json({ error: err.message, statusCode: 422 });
    return;
  }

  if (err instanceof SchemaNotFoundException) {
    res.status(404).json({ error: err.message, statusCode: 404 });
    return;
  }

  if (err instanceof ConversationNotFoundException) {
    res.status(404).json({ error: err.message, statusCode: 404 });
    return;
  }

  next(err);
}
