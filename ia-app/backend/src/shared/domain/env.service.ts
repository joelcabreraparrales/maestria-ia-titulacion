export abstract class EnvService {
  public abstract get(key: string): string;
  public abstract getInt(key: string, defaultValue?: number): number;
  public abstract getOptional(key: string): string | undefined;
}
