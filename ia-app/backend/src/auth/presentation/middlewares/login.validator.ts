import { body } from "express-validator";

export const loginValidator = [
  body("username")
    .trim()
    .notEmpty().withMessage("El username es requerido")
    .isLength({ max: 250 }).withMessage("El username no puede superar 250 caracteres"),
  body("password")
    .notEmpty().withMessage("La contraseña es requerida"),
];
