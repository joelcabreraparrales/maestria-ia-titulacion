import { SessionRepository } from "../domain/classes/session.repository";
import { LogService } from "../domain/classes/log.service";
import { LogoutUseCase } from "../domain/classes/logout.use.case";
import { InvalidSessionException } from "../domain/exceptions/invalid.session.exception";

export class ImpLogoutUseCase extends LogoutUseCase {
  constructor(
    private readonly repository: SessionRepository,
    private readonly log: LogService,
  ) {
    super();
  }

  public async logout(sessionCode: string, token: string): Promise<void> {
    const session = await this.repository.findActiveByCode(sessionCode);
    if (!session) throw new InvalidSessionException();
    if (session.accessToken !== token) throw new InvalidSessionException();

    await this.repository.deactivateSession(sessionCode);

    await this.log.registerAction(
      session.credentialId,
      session.sessionId,
      "USER LOGGED OUT",
    );
  }
}
