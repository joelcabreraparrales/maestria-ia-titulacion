import { body } from "express-validator";

export const queryValidator = [
  body("query")
    .trim()
    .notEmpty().withMessage("El campo 'query' es requerido")
    .isLength({ max: 2000 }).withMessage("La consulta no puede superar 2000 caracteres"),
  body("conversationCode")
    .optional()
    .isUUID().withMessage("conversationCode debe ser un UUID válido"),
  body("targetSchemas")
    .optional()
    .isArray().withMessage("targetSchemas debe ser un arreglo"),
];
