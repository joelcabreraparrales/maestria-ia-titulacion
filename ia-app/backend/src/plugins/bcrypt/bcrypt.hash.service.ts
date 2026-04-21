import bcrypt from "bcryptjs";
import { HashService } from "../../shared/domain/hash.service";

export class BcryptHashService extends HashService {
  public async verifyHash(hash: string, textPlain: string): Promise<boolean> {
    return bcrypt.compare(textPlain, hash);
  }
}
