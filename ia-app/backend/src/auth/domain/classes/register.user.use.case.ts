import { RegisterUserInput } from "../interfaces/register.user.input.interface";

export abstract class RegisterUserUseCase {
  public abstract register(input: RegisterUserInput): Promise<void>;
}
