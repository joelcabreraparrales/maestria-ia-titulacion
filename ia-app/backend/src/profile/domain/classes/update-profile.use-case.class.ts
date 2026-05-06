import { ProfileEntity } from "../entities/profile.entity";
import { UpdateProfileInput } from "../interfaces/profile.interface";

export abstract class UpdateProfileUseCase {
  public abstract execute(credentialId: number, data: UpdateProfileInput): Promise<ProfileEntity>;
}
