import { AuthDatasource } from "../../domain/classes/auth.datasource";
import { AuthRepository } from "../../domain/classes/auth.repository";
import { CredentialEntity } from "../../domain/entities/credential.entity";
import { Credential } from "../../domain/classes/credential.class";
import { UserNotFoundException } from "../../domain/exceptions/user.not.found.exception";

export class ImpAuthRepository extends AuthRepository {
  constructor(private readonly datasource: AuthDatasource) {
    super();
  }

  public async getCredential(username: string): Promise<Credential> {
    const raw = await this.datasource.getCredential(username);
    if (!raw) throw new UserNotFoundException();

    const {
      credential_id: id,
      username: $username,
      credential_password: password,
      credential_locked: locked,
      credential_role: credentialRoles,
      profile,
    } = raw;

    const roles = (credentialRoles as Array<{ role: { role_name: string } }>)
      .map((cr) => cr.role.role_name);

    const { first_name, first_lastname } = profile as { first_name: string; first_lastname: string };

    return new CredentialEntity(
      Number(id),
      String($username),
      String(password),
      roles,
      !Boolean(locked),
      { firstName: first_name, firstLastname: first_lastname },
    );
  }

  public async recordFailedAttempt(credentialId: number, maxAttempts: number): Promise<void> {
    return this.datasource.recordFailedAttempt(credentialId, maxAttempts);
  }

  public async resetFailedAttempts(credentialId: number): Promise<void> {
    return this.datasource.resetFailedAttempts(credentialId);
  }
}
