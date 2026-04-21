import { PrismaClient, Prisma } from "../../../../prisma/generated/prisma/client";
import { Session } from "../../domain/classes/session.class";
import { SessionDatasource } from "../../domain/classes/session.datasource";
import { SessionSavedResult } from "../../domain/interfaces/session.saved.result.interface";
import { SessionRefreshData } from "../../domain/interfaces/session.refresh.data.interface";
import { TooManySessionsException } from "../../domain/exceptions/too.many.sessions.exception";

export class PostgreSessionDatasource extends SessionDatasource {
  constructor(private db: PrismaClient) {
    super();
  }

  public async saveWithSessionLimit(session: Session, maxSessions: number): Promise<SessionSavedResult> {
    return this.db.$transaction(async (tx) => {
      const count = await tx.user_session.count({
        where: { credential_id: session.getCredential(), session_active: true },
      });
      if (count >= maxSessions) throw new TooManySessionsException();

      const newSession = await tx.user_session.create({
        data: {
          credential_id: session.getCredential(),
          access_token: session.getToken(),
          session_code: session.getCode(),
          date_init: new Date(session.getDateInit()),
          date_end: new Date(session.getDateEnd()),
        },
      });
      await tx.$executeRaw(Prisma.sql`
        UPDATE auth.credential
        SET last_login = NOW()
        WHERE credential_id = ${session.getCredential()}
      `);
      return { sessionId: newSession.session_id };
    });
  }

  public async deactivateSession(sessionCode: string): Promise<void> {
    await this.db.user_session.update({
      where: { session_code: sessionCode },
      data: { session_active: false },
    });
  }

  public async findActiveByCode(sessionCode: string): Promise<SessionRefreshData | null> {
    const session = await this.db.user_session.findUnique({
      where: { session_code: sessionCode, session_active: true },
      include: {
        credential: {
          include: {
            credential_role: { include: { role: true } },
          },
        },
      },
    });
    if (!session) return null;
    return {
      sessionId: session.session_id,
      credentialId: session.credential_id,
      username: session.credential.username,
      roles: session.credential.credential_role.map((cr) => cr.role.role_name),
      dateEnd: session.date_end,
      accessToken: session.access_token,
    };
  }

  public async updateAccessToken(sessionCode: string, newToken: string, newDateEnd: Date): Promise<void> {
    await this.db.user_session.update({
      where: { session_code: sessionCode },
      data: { access_token: newToken, date_end: newDateEnd },
    });
  }
}
