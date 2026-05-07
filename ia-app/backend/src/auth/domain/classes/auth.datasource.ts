export interface CreateUserData {
  firstName: string;
  firstLastname: string;
  email: string;
  dni: string;
  dateBirth: Date;
  username: string;
  passwordHash: string;
  profileCode: string;
  credentialCode: string;
}

export abstract class AuthDatasource {
  public abstract getCredential(username: string): Promise<Record<string, unknown>>;
  public abstract recordFailedAttempt(credentialId: number, maxAttempts: number): Promise<void>;
  public abstract resetFailedAttempts(credentialId: number): Promise<void>;
  public abstract createUser(data: CreateUserData): Promise<void>;
}
