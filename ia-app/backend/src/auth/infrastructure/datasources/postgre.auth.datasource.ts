import { PrismaClient } from "../../../../prisma/generated/prisma/client";
import { AuthDatasource, CreateUserData } from "../../domain/classes/auth.datasource";

export class PostgreAuthDatasource extends AuthDatasource {
  constructor(private db: PrismaClient) {
    super();
  }

  public async getCredential(username: string): Promise<Record<string, unknown>> {
    const credential = await this.db.credential.findUnique({
      where: { username },
      include: {
        profile: true,
        credential_role: {
          include: { role: true },
        },
      },
    });
    return credential as Record<string, unknown>;
  }

  public async recordFailedAttempt(credentialId: number, maxAttempts: number): Promise<void> {
    const updated = await this.db.credential.update({
      where: { credential_id: credentialId },
      data: { failed_login_attempts: { increment: 1 } },
      select: { failed_login_attempts: true },
    });
    if ((updated.failed_login_attempts ?? 0) >= maxAttempts) {
      await this.db.credential.update({
        where: { credential_id: credentialId },
        data: { credential_locked: true },
      });
    }
  }

  public async resetFailedAttempts(credentialId: number): Promise<void> {
    await this.db.credential.update({
      where: { credential_id: credentialId },
      data: { failed_login_attempts: 0 },
    });
  }

  public async createUser(data: CreateUserData): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const profile = await tx.profile.create({
        data: {
          profile_code: data.profileCode,
          first_name: data.firstName,
          first_lastname: data.firstLastname,
          profile_email: data.email,
          dni: data.dni,
          date_birth: data.dateBirth,
        },
      });

      const credential = await tx.credential.create({
        data: {
          credential_code: data.credentialCode,
          profile_id: profile.profile_id,
          username: data.username,
          credential_password: data.passwordHash,
        },
      });

      const defaultRole = await tx.role.findFirst({
        where: { role_active: true },
        orderBy: { role_id: "asc" },
      });

      if (defaultRole) {
        await tx.credential_role.create({
          data: {
            credential_id: credential.credential_id,
            role_id: defaultRole.role_id,
          },
        });
      }
    });
  }
}
