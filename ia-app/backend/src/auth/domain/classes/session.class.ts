export abstract class Session {
  public abstract getCredential(): number;
  public abstract getCode(): string;
  public abstract getToken(): string;
  public abstract getDateInit(): string;
  public abstract getDateEnd(): string;
  public abstract getSessionActive(): boolean;
}