export abstract class HashService {
  public abstract verifyHash(hash: string, textPlain: string): Promise<boolean>;
}