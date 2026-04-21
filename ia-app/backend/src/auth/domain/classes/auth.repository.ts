import { Credential } from "./credential.class";

export abstract class AuthRepository {
  public abstract getCredential(username: string): Promise<Credential>;
  public abstract recordFailedAttempt(credentialId: number, maxAttempts: number): Promise<void>;
  public abstract resetFailedAttempts(credentialId: number): Promise<void>;
}
