import { Session } from "./session.class";
import { SessionSavedResult } from "../interfaces/session.saved.result.interface";
import { SessionRefreshData } from "../interfaces/session.refresh.data.interface";

export abstract class SessionDatasource {
  public abstract saveWithSessionLimit(session: Session, maxSessions: number): Promise<SessionSavedResult>;
  public abstract deactivateSession(sessionCode: string): Promise<void>;
  public abstract findActiveByCode(sessionCode: string): Promise<SessionRefreshData | null>;
  public abstract updateAccessToken(sessionCode: string, newToken: string, newDateEnd: Date): Promise<void>;
}
