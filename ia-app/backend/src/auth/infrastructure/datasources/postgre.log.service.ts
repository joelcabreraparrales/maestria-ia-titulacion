import { PrismaClient } from "../../../../prisma/generated/prisma/client";
import { LogService } from "../../domain/classes/log.service";

export class ImpLogService extends LogService {
  constructor(private readonly db: PrismaClient) {
    super();
  }

  public async registerAction(credentialId: number, sessionId: number, action: string): Promise<void> {
    await this.db.audit_log.create({
      data: {
        credential_id: credentialId,
        session_id: sessionId,
        user_action: action,
      },
    });
  }
}
