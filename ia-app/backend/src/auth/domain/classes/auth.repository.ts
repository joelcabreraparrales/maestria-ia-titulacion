import { Credential } from "./credential.class";
import { RegisterUserInput } from "../interfaces/register.user.input.interface";

export abstract class AuthRepository {
  public abstract getCredential(username: string): Promise<Credential>;
  public abstract recordFailedAttempt(credentialId: number, maxAttempts: number): Promise<void>;
  public abstract resetFailedAttempts(credentialId: number): Promise<void>;
  public abstract registerUser(input: RegisterUserInput & { passwordHash: string }): Promise<void>;
}
