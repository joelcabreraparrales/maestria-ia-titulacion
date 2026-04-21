export abstract class TokenService {
  public abstract generateToken(data: Record<string, unknown>): string;
}
