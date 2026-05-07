import { Request, Response, NextFunction } from "express";
import { InvalidCredentialsException } from "../../domain/exceptions/invalid.credential.exception";
import { InactiveUserException } from "../../domain/exceptions/inactive.user.exception";
import { UserNotFoundException } from "../../domain/exceptions/user.not.found.exception";
import { UserAlreadyExistsException } from "../../domain/exceptions/user.already.exists.exception";
import { TooManySessionsException } from "../../domain/exceptions/too.many.sessions.exception";
import { InvalidSessionException } from "../../domain/exceptions/invalid.session.exception";
import { ProfileNotFoundException } from "../../../profile/domain/exceptions/profile-not-found.exception";

export function errorHandlerMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // S-2: UserNotFoundException unificada a 401 para evitar enumeración de usuarios
  if (err instanceof UserNotFoundException || err instanceof InvalidCredentialsException) {
    res.status(401).json({ error: "Credenciales inválidas", statusCode: 401 });
    return;
  }

  if (err instanceof UserAlreadyExistsException) {
    res.status(409).json({ error: err.message, statusCode: 409 });
    return;
  }

  if (err instanceof InactiveUserException) {
    res.status(403).json({ error: err.message, statusCode: 403 });
    return;
  }

  if (err instanceof TooManySessionsException) {
    res.status(429).json({ error: err.message, statusCode: 429 });
    return;
  }

  if (err instanceof InvalidSessionException) {
    res.status(401).json({ error: err.message, statusCode: 401 });
    return;
  }

  if (err instanceof ProfileNotFoundException) {
    res.status(404).json({ error: err.message, statusCode: 404 });
    return;
  }

  res.status(500).json({ error: "Error interno del servidor", statusCode: 500 });
}
