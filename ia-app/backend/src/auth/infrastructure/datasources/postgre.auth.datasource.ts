import { PrismaClient } from "../../../../prisma/generated/prisma/client";
import { AuthDatasource } from "../../domain/classes/auth.datasource";

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
}
