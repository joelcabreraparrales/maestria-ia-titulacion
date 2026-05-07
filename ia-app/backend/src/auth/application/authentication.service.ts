import { AuthenticateUserUseCase } from "../domain/classes/authenticate.user.use.case";
import { GenerateSessionUseCase } from "../domain/classes/generate.session.use.case";
import { LogoutUseCase } from "../domain/classes/logout.use.case";
import { RefreshSessionUseCase } from "../domain/classes/refresh.session.use.case";
import { RegisterUserUseCase } from "../domain/classes/register.user.use.case";
import { LoginResult } from "../domain/interfaces/login.result.interface";
import { RefreshResult } from "../domain/interfaces/refresh.result.interface";
import { RegisterUserInput } from "../domain/interfaces/register.user.input.interface";

export class AuthenticationService {
  constructor(
    private readonly auth: AuthenticateUserUseCase,
    private readonly session: GenerateSessionUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshUseCase: RefreshSessionUseCase,
    private readonly registerUseCase: RegisterUserUseCase,
  ) {}

  public async login(username: string, password: string): Promise<LoginResult> {
    const credential = await this.auth.authenticate(username, password);
    const { session } = await this.session.generateSession(credential);
    return {
      session,
      roles: credential.getRoles(),
      profile: credential.getProfile(),
    };
  }

  public async logout(sessionCode: string, token: string): Promise<void> {
    return this.logoutUseCase.logout(sessionCode, token);
  }

  public async refresh(sessionCode: string, token: string): Promise<RefreshResult> {
    return this.refreshUseCase.refresh(sessionCode, token);
  }

  public async register(input: RegisterUserInput): Promise<void> {
    return this.registerUseCase.register(input);
  }
}
