export abstract class LogService {
  public abstract registerAction(credentialId: number, sessionId: number, action: string): Promise<void>;
}
