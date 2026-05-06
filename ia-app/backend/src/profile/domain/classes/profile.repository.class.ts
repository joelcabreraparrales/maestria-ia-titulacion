import { ProfileEntity } from "../entities/profile.entity";
import { UpdateProfileInput } from "../interfaces/profile.interface";

export abstract class ProfileRepository {
  public abstract getProfile(credentialId: number): Promise<ProfileEntity>;
  public abstract updateProfile(credentialId: number, data: UpdateProfileInput): Promise<ProfileEntity>;
}
