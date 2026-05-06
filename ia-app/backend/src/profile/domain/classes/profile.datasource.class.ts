import { UpdateProfileInput } from "../interfaces/profile.interface";

export abstract class ProfileDatasource {
  public abstract getByCredentialId(credentialId: number): Promise<Record<string, unknown>>;
  public abstract update(credentialId: number, data: UpdateProfileInput): Promise<Record<string, unknown>>;
}
