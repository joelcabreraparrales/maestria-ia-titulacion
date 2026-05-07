import bcrypt from "bcryptjs";
import { HashService } from "../../shared/domain/hash.service";

export class BcryptHashService extends HashService {
  public async verifyHash(hash: string, textPlain: string): Promise<boolean> {
    return bcrypt.compare(textPlain, hash);
  }

  public async hash(textPlain: string): Promise<string> {
    return bcrypt.hash(textPlain, 10);
  }
}
