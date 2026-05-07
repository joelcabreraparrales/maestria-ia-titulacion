import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Datos de entrada inválidos",
      statusCode: 400,
      details: errors.array().map((e) => ({ field: e.type === "field" ? e.path : e.type, message: e.msg })),
    });
    return;
  }
  next();
}
