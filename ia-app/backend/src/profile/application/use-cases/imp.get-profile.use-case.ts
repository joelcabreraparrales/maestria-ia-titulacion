import { ProfileRepository } from "../../domain/classes/profile.repository.class";
import { GetProfileUseCase } from "../../domain/classes/get-profile.use-case.class";
import { ProfileEntity } from "../../domain/entities/profile.entity";

export class ImpGetProfileUseCase extends GetProfileUseCase {
  constructor(private readonly repository: ProfileRepository) {
    super();
  }

  public async execute(credentialId: number): Promise<ProfileEntity> {
    return this.repository.getProfile(credentialId);
  }
}
