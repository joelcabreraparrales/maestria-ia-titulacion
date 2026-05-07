import { RegisterUserUseCase } from "../domain/classes/register.user.use.case";
import { AuthRepository } from "../domain/classes/auth.repository";
import { HashService } from "../../shared/domain/hash.service";
import { RegisterUserInput } from "../domain/interfaces/register.user.input.interface";

export class ImpRegisterUserUseCase extends RegisterUserUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly hashService: HashService,
  ) {
    super();
  }

  public async register(input: RegisterUserInput): Promise<void> {
    const passwordHash = await this.hashService.hash(input.password);
    return this.authRepository.registerUser({ ...input, passwordHash });
  }
}
