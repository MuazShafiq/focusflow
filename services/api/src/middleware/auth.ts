import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";

export const requireAuth = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const [scheme, token] = req.headers.authorization?.split(" ") ?? [];

  if (scheme !== "Bearer" || !token) {
    next(new ApiError(401, "Authentication is required"));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    if (payload.type !== "access") {
      throw new Error("Incorrect token type");
    }
    req.userId = payload.sub;
    next();
  } catch {
    next(new ApiError(401, "The access token is invalid or expired"));
  }
};
