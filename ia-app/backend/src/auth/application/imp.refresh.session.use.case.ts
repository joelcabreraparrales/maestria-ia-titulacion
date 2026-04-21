import { DateManager } from "../../plugins/dayjs/dayjs.class";
import { TokenService } from "../../shared/domain/token.generator.service";
import { SessionRepository } from "../domain/classes/session.repository";
import { LogService } from "../domain/classes/log.service";
import { RefreshSessionUseCase } from "../domain/classes/refresh.session.use.case";
import { InvalidSessionException } from "../domain/exceptions/invalid.session.exception";
import { RefreshResult } from "../domain/interfaces/refresh.result.interface";
import { SessionConfig } from "../domain/enums/session.enum";

export class ImpRefreshSessionUseCase extends RefreshSessionUseCase {
  constructor(
    private readonly repository: SessionRepository,
    private readonly tokenService: TokenService,
    private readonly dateManager: DateManager,
    private readonly log: LogService,
  ) {
    super();
  }

  public async refresh(sessionCode: string, token: string): Promise<RefreshResult> {
    const sessionData = await this.repository.findActiveByCode(sessionCode);
    if (!sessionData) throw new InvalidSessionException();
    if (sessionData.accessToken !== token) throw new InvalidSessionException();
    if (sessionData.dateEnd <= new Date()) throw new InvalidSessionException();

    const newToken = this.tokenService.generateToken({
      username: sessionData.username,
      roles: sessionData.roles,
    });
    const newDateEndStr = this.dateManager.add(
      this.dateManager.getStringDate(SessionConfig.DATE_FORMAT),
      SessionConfig.DURATION_HOURS,
      "hours",
    );

    await this.repository.updateAccessToken(sessionCode, newToken, new Date(newDateEndStr));

    await this.log.registerAction(
      sessionData.credentialId,
      sessionData.sessionId,
      `TOKEN REFRESHED | previous_token: ${sessionData.accessToken} | new_token: ${newToken}`,
    );

    return { token: newToken, sessionCode };
  }
}
