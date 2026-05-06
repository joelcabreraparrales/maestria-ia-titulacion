import { ProfileEntity } from "../entities/profile.entity";

export abstract class GetProfileUseCase {
  public abstract execute(credentialId: number): Promise<ProfileEntity>;
}
