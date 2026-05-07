import { body } from "express-validator";

export const registerValidator = [
  body("firstName")
    .trim()
    .notEmpty().withMessage("El nombre es requerido")
    .isLength({ max: 50 }).withMessage("El nombre no puede superar 50 caracteres"),
  body("firstLastname")
    .trim()
    .notEmpty().withMessage("El primer apellido es requerido")
    .isLength({ max: 50 }).withMessage("El apellido no puede superar 50 caracteres"),
  body("email")
    .trim()
    .notEmpty().withMessage("El correo es requerido")
    .isEmail().withMessage("El correo no es válido")
    .isLength({ max: 250 }).withMessage("El correo no puede superar 250 caracteres"),
  body("dni")
    .trim()
    .notEmpty().withMessage("El DNI es requerido")
    .isLength({ max: 25 }).withMessage("El DNI no puede superar 25 caracteres"),
  body("dateBirth")
    .notEmpty().withMessage("La fecha de nacimiento es requerida")
    .isISO8601().withMessage("La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)"),
  body("username")
    .trim()
    .notEmpty().withMessage("El username es requerido")
    .isLength({ min: 3, max: 250 }).withMessage("El username debe tener entre 3 y 250 caracteres")
    .matches(/^[a-zA-Z0-9._-]+$/).withMessage("El username solo puede contener letras, números, puntos, guiones y guiones bajos"),
  body("password")
    .notEmpty().withMessage("La contraseña es requerida")
    .isLength({ min: 8 }).withMessage("La contraseña debe tener al menos 8 caracteres"),
];
