import rateLimit from "express-rate-limit";

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: { error: "Demasiados intentos. Intente nuevamente en 15 minutos.", statusCode: 429 },
  standardHeaders: true,
  legacyHeaders: false,
});
