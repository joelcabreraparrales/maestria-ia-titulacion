import { DateManager } from "../../plugins/dayjs/dayjs.class";
import { CodeGeneratorService } from "../../shared/domain/code.generator.service";
import { TokenService } from "../../shared/domain/token.generator.service";
import { Credential } from "../domain/classes/credential.class";
import { GenerateSessionUseCase } from "../domain/classes/generate.session.use.case";
import { SessionRepository } from "../domain/classes/session.repository";
import { SessionEntity } from "../domain/entities/session.entity";
import { GeneratedSessionResult } from "../domain/interfaces/generated.session.result.interface";

const MAX_ACTIVE_SESSIONS = 5;

export class ImpGenerateSessionUseCase extends GenerateSessionUseCase {
  constructor(
    private readonly tokenService: TokenService,
    private readonly repository: SessionRepository,
    private readonly uuid: CodeGeneratorService,
    private readonly dateManager: DateManager,
  ) {
    super();
  }

  public async generateSession(credential: Credential): Promise<GeneratedSessionResult> {
    const session = new SessionEntity(
      {
        credentialId: credential.getId(),
        sessionCode: this.uuid.generateCode(),
        accessToken: this.tokenService.generateToken({
          credentialId: credential.getId(),
          username: credential.getUsername(),
          roles: credential.getRoles(),
        }),
      },
      this.dateManager,
    );
    const { sessionId } = await this.repository.saveWithSessionLimit(session, MAX_ACTIVE_SESSIONS);
    return { session, sessionId };
  }
}
