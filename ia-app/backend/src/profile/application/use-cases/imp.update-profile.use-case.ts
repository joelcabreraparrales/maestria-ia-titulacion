import { ProfileRepository } from "../../domain/classes/profile.repository.class";
import { UpdateProfileUseCase } from "../../domain/classes/update-profile.use-case.class";
import { ProfileEntity } from "../../domain/entities/profile.entity";
import { UpdateProfileInput } from "../../domain/interfaces/profile.interface";

export class ImpUpdateProfileUseCase extends UpdateProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {
    super();
  }

  public async execute(credentialId: number, data: UpdateProfileInput): Promise<ProfileEntity> {
    return this.repository.updateProfile(credentialId, data);
  }
}
