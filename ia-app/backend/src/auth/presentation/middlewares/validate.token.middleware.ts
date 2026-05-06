import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  credentialId: number;
  username: string;
  roles: string[];
}

export function validateTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token no proporcionado", statusCode: 401 });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    res.locals.token = token;
    res.locals.credentialId = payload.credentialId;
    res.locals.username = payload.username;
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o expirado", statusCode: 401 });
  }
}
