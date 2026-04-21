import { HashService } from "../../../shared/domain/hash.service";
import { UserProfile } from "../interfaces/user.profile.interface";

export abstract class Credential {
  public abstract authenticateUser(userPassword: string, hashService: HashService): Promise<Credential>;
  public abstract getId(): number;
  public abstract getUsername(): string;
  public abstract getRoles(): string[];
  public abstract isActive(): boolean;
  public abstract getProfile(): UserProfile;
}
