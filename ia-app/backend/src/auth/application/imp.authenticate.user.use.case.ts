import { HashService } from "../../shared/domain/hash.service";
import { AuthRepository } from "../domain/classes/auth.repository";
import { AuthenticateUserUseCase } from "../domain/classes/authenticate.user.use.case";
import { Credential } from "../domain/classes/credential.class";
import { InvalidCredentialsException } from "../domain/exceptions/invalid.credential.exception";

const MAX_FAILED_ATTEMPTS = 5;

export class ImpAuthenticateUserUseCase extends AuthenticateUserUseCase {
  constructor(
    private readonly repository: AuthRepository,
    private readonly hashService: HashService,
  ) {
    super();
  }

  public async authenticate(username: string, userPassword: string): Promise<Credential> {
    const credential = await this.repository.getCredential(username);
    try {
      const authenticated = await credential.authenticateUser(userPassword, this.hashService);
      await this.repository.resetFailedAttempts(credential.getId());
      return authenticated;
    } catch (error) {
      if (error instanceof InvalidCredentialsException) {
        await this.repository.recordFailedAttempt(credential.getId(), MAX_FAILED_ATTEMPTS);
      }
      throw error;
    }
  }
}
