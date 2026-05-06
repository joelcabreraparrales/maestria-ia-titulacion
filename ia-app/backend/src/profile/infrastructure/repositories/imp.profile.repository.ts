import { ProfileDatasource } from "../../domain/classes/profile.datasource.class";
import { ProfileRepository } from "../../domain/classes/profile.repository.class";
import { ProfileEntity } from "../../domain/entities/profile.entity";
import { ProfileNotFoundException } from "../../domain/exceptions/profile-not-found.exception";
import { UpdateProfileInput } from "../../domain/interfaces/profile.interface";

export class ImpProfileRepository extends ProfileRepository {
  constructor(private readonly datasource: ProfileDatasource) {
    super();
  }

  public async getProfile(credentialId: number): Promise<ProfileEntity> {
    const raw = await this.datasource.getByCredentialId(credentialId);
    if (!raw || !raw["profile_id"]) throw new ProfileNotFoundException();
    return this.mapToEntity(raw);
  }

  public async updateProfile(credentialId: number, data: UpdateProfileInput): Promise<ProfileEntity> {
    const raw = await this.datasource.update(credentialId, data);
    if (!raw || !raw["profile_id"]) throw new ProfileNotFoundException();
    return this.mapToEntity(raw);
  }

  private mapToEntity(raw: Record<string, unknown>): ProfileEntity {
    return new ProfileEntity(
      Number(raw["profile_id"]),
      String(raw["profile_code"]),
      String(raw["first_name"]),
      String(raw["first_lastname"]),
      raw["second_name"] ? String(raw["second_name"]) : null,
      raw["second_lastname"] ? String(raw["second_lastname"]) : null,
      String(raw["profile_email"]),
      String(raw["dni"]),
      new Date(raw["date_birth"] as string),
      Boolean(raw["profile_active"]),
      new Date(raw["created_at"] as string),
      new Date(raw["updated_at"] as string),
    );
  }
}
