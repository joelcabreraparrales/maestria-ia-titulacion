import { GetProfileUseCase } from "../domain/classes/get-profile.use-case.class";
import { UpdateProfileUseCase } from "../domain/classes/update-profile.use-case.class";
import { ProfileEntity } from "../domain/entities/profile.entity";
import { UpdateProfileInput } from "../domain/interfaces/profile.interface";

export class ProfileService {
  constructor(
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
  ) {}

  public async getProfile(credentialId: number): Promise<ProfileEntity> {
    return this.getProfileUseCase.execute(credentialId);
  }

  public async updateProfile(credentialId: number, data: UpdateProfileInput): Promise<ProfileEntity> {
    return this.updateProfileUseCase.execute(credentialId, data);
  }
}
