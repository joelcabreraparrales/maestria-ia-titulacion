import { PrismaClient } from "../../../../prisma/generated/prisma/client";
import { ProfileDatasource } from "../../domain/classes/profile.datasource.class";
import { UpdateProfileInput } from "../../domain/interfaces/profile.interface";

export class PostgreProfileDatasource extends ProfileDatasource {
  constructor(private readonly db: PrismaClient) {
    super();
  }

  public async getByCredentialId(credentialId: number): Promise<Record<string, unknown>> {
    const credential = await this.db.credential.findUnique({
      where: { credential_id: credentialId },
      include: { profile: true },
    });
    if (!credential?.profile) return {};
    return credential.profile as Record<string, unknown>;
  }

  public async update(credentialId: number, data: UpdateProfileInput): Promise<Record<string, unknown>> {
    const credential = await this.db.credential.findUnique({
      where: { credential_id: credentialId },
      select: { profile_id: true },
    });
    if (!credential) return {};

    const updated = await this.db.profile.update({
      where: { profile_id: credential.profile_id },
      data: {
        ...(data.firstName !== undefined && { first_name: data.firstName }),
        ...(data.firstLastname !== undefined && { first_lastname: data.firstLastname }),
        ...(data.secondName !== undefined && { second_name: data.secondName }),
        ...(data.secondLastname !== undefined && { second_lastname: data.secondLastname }),
        ...(data.dateBirth !== undefined && { date_birth: new Date(data.dateBirth) }),
      },
    });
    return updated as Record<string, unknown>;
  }
}
