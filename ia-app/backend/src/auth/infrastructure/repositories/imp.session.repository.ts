import { LogService } from "../../domain/classes/log.service";
import { Session } from "../../domain/classes/session.class";
import { SessionDatasource } from "../../domain/classes/session.datasource";
import { SessionRepository } from "../../domain/classes/session.repository";
import { SessionSavedResult } from "../../domain/interfaces/session.saved.result.interface";
import { SessionRefreshData } from "../../domain/interfaces/session.refresh.data.interface";

export class ImpSessionRepository extends SessionRepository {
  constructor(
    private readonly datasource: SessionDatasource,
    private readonly log: LogService,
  ) {
    super();
  }

  public async saveWithSessionLimit(session: Session, maxSessions: number): Promise<SessionSavedResult> {
    const result = await this.datasource.saveWithSessionLimit(session, maxSessions);
    await this.log.registerAction(session.getCredential(), result.sessionId, "USER SUCCESSFULLY AUTHENTICATED");
    return result;
  }

  public async deactivateSession(sessionCode: string): Promise<void> {
    return this.datasource.deactivateSession(sessionCode);
  }

  public async findActiveByCode(sessionCode: string): Promise<SessionRefreshData | null> {
    return this.datasource.findActiveByCode(sessionCode);
  }

  public async updateAccessToken(sessionCode: string, newToken: string, newDateEnd: Date): Promise<void> {
    return this.datasource.updateAccessToken(sessionCode, newToken, newDateEnd);
  }
}
