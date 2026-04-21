import { Credential } from "./credential.class";

export abstract class AuthenticateUserUseCase {
  public abstract authenticate(username: string, userPassword: string): Promise<Credential>;
}