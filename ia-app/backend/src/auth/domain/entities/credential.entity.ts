import { HashService } from "../../../shared/domain/hash.service";
import { Credential } from "../classes/credential.class";
import { UserProfile } from "../interfaces/user.profile.interface";
import { InactiveUserException } from "../exceptions/inactive.user.exception";
import { InvalidCredentialsException } from "../exceptions/invalid.credential.exception";

export class CredentialEntity extends Credential {
  constructor(
    private readonly id: number,
    private readonly username: string,
    private readonly passwordHash: string,
    private readonly roles: string[],
    private readonly active: boolean,
    private readonly profile: UserProfile,
  ) {
    super();
  }

  public async authenticateUser(userPassword: string, hashService: HashService): Promise<Credential> {
    if (!this.active) throw new InactiveUserException();
    const isValid = await hashService.verifyHash(this.passwordHash, userPassword);
    if (!isValid) throw new InvalidCredentialsException();
    return this;
  }

  public getId(): number { return this.id; }
  public getUsername(): string { return this.username; }
  public getRoles(): string[] { return [...this.roles]; }
  public isActive(): boolean { return this.active; }
  public getProfile(): UserProfile { return { ...this.profile }; }
}
