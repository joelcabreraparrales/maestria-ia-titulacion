export abstract class LogoutUseCase {
  public abstract logout(sessionCode: string, token: string): Promise<void>;
}
