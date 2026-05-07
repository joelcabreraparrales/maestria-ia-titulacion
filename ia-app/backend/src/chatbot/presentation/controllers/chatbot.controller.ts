import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ChatbotService } from "../../application/chatbot.service";
import { QueryRequestDTO } from "../dtos/query-request.dto";
import { QueryResponseDTO, ConversationSummaryDTO, ConversationDetailDTO } from "../dtos/query-response.dto";

interface JwtPayload {
  credentialId: number;
  username: string;
  roles: string[];
}

export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  public query = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query, conversationCode, targetSchemas } = req.body as QueryRequestDTO;

      if (!query || query.trim().length === 0) {
        res.status(400).json({ error: "El campo 'query' es requerido y no puede estar vacío", statusCode: 400 });
        return;
      }

      const { credentialId, username } = this.extractPayload(res.locals.token as string);

      const result = await this.chatbotService.query({
        credentialId,
        username,
        query: query.trim(),
        conversationCode,
        targetSchemas,
      });

      const response: QueryResponseDTO = {
        conversationCode: result.conversationCode,
        messageCode: result.messageCode,
        userQuery: result.userQuery,
        sqlGenerated: result.sqlGenerated,
        explanation: result.explanation,
        data: result.data,
        rowCount: result.rowCount,
        executionMs: result.executionMs,
        charts: result.charts,
        recommendedChart: result.recommendedChart,
        suggestedFollowUps: result.suggestedFollowUps,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public listConversations = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { credentialId } = this.extractPayload(res.locals.token as string);
      const conversations = await this.chatbotService.listUserConversations(credentialId);

      const response: ConversationSummaryDTO[] = conversations.map((c) => ({
        conversationCode: c.getCode(),
        title: c.getTitle(),
        createdAt: c.getCreatedAt(),
      }));

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public getConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;

      if (!id) {
        res.status(400).json({ error: "conversationCode es requerido", statusCode: 400 });
        return;
      }

      const { credentialId } = this.extractPayload(res.locals.token as string);
      const conversation = await this.chatbotService.getConversationHistory(id, credentialId);

      const response: ConversationDetailDTO = {
        conversationCode: conversation.getCode(),
        title: conversation.getTitle(),
        createdAt: conversation.getCreatedAt(),
        messages: conversation.getMessages().map((m) => ({
          messageCode: m.getCode(),
          role: m.getRole(),
          content: m.getContent(),
          createdAt: m.getCreatedAt(),
        })),
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public queryStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { query, conversationCode, targetSchemas } = req.body as QueryRequestDTO;

      if (!query || query.trim().length === 0) {
        res.status(400).json({ error: "El campo 'query' es requerido y no puede estar vacío", statusCode: 400 });
        return;
      }

      const { credentialId, username } = this.extractPayload(res.locals.token as string);

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.flushHeaders();

      const sendEvent = (event: string, data: unknown): void => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      await this.chatbotService.streamQuery(
        { credentialId, username, query: query.trim(), conversationCode, targetSchemas },
        {
          onThinking: (step, message) => sendEvent("thinking", { step, message }),
          onSqlReady: (sqlArray) => sendEvent("sql_ready", { sql: sqlArray.join(" --- ") }),
          onComplete: (result) => {
            const response: QueryResponseDTO = {
              conversationCode: result.conversationCode,
              messageCode: result.messageCode,
              userQuery: result.userQuery,
              sqlGenerated: result.sqlGenerated,
              explanation: result.explanation,
              data: result.data,
              rowCount: result.rowCount,
              executionMs: result.executionMs,
              charts: result.charts,
              recommendedChart: result.recommendedChart,
              suggestedFollowUps: result.suggestedFollowUps,
            };
            sendEvent("complete", response);
            res.end();
          },
          onError: (error) => {
            sendEvent("error", { message: error.message });
            res.end();
          },
        },
      );
    } catch (error) {
      if (!res.headersSent) {
        next(error);
      } else {
        const msg = error instanceof Error ? error.message : "Error inesperado";
        res.write(`event: error\ndata: ${JSON.stringify({ message: msg })}\n\n`);
        res.end();
      }
    }
  };

  public deleteConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params["id"] as string;

      if (!id) {
        res.status(400).json({ error: "conversationCode es requerido", statusCode: 400 });
        return;
      }

      const { credentialId } = this.extractPayload(res.locals.token as string);
      await this.chatbotService.deleteConversation(id, credentialId);
      res.status(200).json({ message: "Conversación eliminada correctamente" });
    } catch (error) {
      next(error);
    }
  };

  private extractPayload(token: string): JwtPayload {
    const payload = jwt.decode(token) as JwtPayload | null;
    if (!payload?.username || payload.credentialId == null) {
      throw new Error("Token inválido: faltan credenciales del usuario");
    }
    return payload;
  }
}
