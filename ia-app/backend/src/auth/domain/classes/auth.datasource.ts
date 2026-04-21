export abstract class AuthDatasource {
  public abstract getCredential(username: string): Promise<Record<string, unknown>>;
  public abstract recordFailedAttempt(credentialId: number, maxAttempts: number): Promise<void>;
  public abstract resetFailedAttempts(credentialId: number): Promise<void>;
}
