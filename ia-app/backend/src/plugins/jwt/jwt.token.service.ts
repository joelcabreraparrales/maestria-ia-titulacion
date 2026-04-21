import jwt from "jsonwebtoken";
import { TokenService } from "../../shared/domain/token.generator.service";

export class JwtTokenService extends TokenService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string,
  ) {
    super();
  }

  public generateToken(data: Record<string, unknown>): string {
    return jwt.sign(data, this.secret, { expiresIn: this.expiresIn } as jwt.SignOptions);
  }
}
