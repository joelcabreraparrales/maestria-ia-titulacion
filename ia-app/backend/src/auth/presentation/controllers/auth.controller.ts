import { Request, Response, NextFunction } from "express";
import { AuthenticationService } from "../../application/authentication.service";
import { LoginRequestDTO, LoginResponseDTO } from "../dtos/login.dto";
import { SessionCodeRequestDTO, RefreshResponseDTO } from "../dtos/session.dto";

export class AuthController {
  constructor(private readonly authService: AuthenticationService) {}

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body as LoginRequestDTO;
      if (!username || !password) {
        res.status(400).json({ error: "username y password son requeridos", statusCode: 400 });
        return;
      }
      const { session, roles, profile } = await this.authService.login(username, password);
      const response: LoginResponseDTO = {
        token: session.getToken(),
        sessionCode: session.getCode(),
        roles,
        firstName: profile.firstName,
        firstLastname: profile.firstLastname,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionCode } = req.body as SessionCodeRequestDTO;
      if (!sessionCode) {
        res.status(400).json({ error: "sessionCode es requerido", statusCode: 400 });
        return;
      }
      const token = res.locals.token as string;
      await this.authService.logout(sessionCode, token);
      res.status(200).json({ message: "Sesión cerrada correctamente" });
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sessionCode } = req.body as SessionCodeRequestDTO;
      if (!sessionCode) {
        res.status(400).json({ error: "sessionCode es requerido", statusCode: 400 });
        return;
      }
      const token = res.locals.token as string;
      const result = await this.authService.refresh(sessionCode, token);
      const response: RefreshResponseDTO = {
        token: result.token,
        sessionCode: result.sessionCode,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };
}
