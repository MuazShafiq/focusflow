import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config.js";

export interface TokenPayload {
  sub: string;
  type: "access" | "refresh";
  tokenVersion: number;
}

const sign = (
  payload: TokenPayload,
  secret: string,
  expiresIn: SignOptions["expiresIn"],
) => jwt.sign(payload, secret, { expiresIn });

export const createTokenPair = (userId: string, tokenVersion: number) => ({
  accessToken: sign(
    { sub: userId, type: "access", tokenVersion },
    config.JWT_ACCESS_SECRET,
    config.ACCESS_TOKEN_TTL as SignOptions["expiresIn"],
  ),
  refreshToken: sign(
    { sub: userId, type: "refresh", tokenVersion },
    config.JWT_REFRESH_SECRET,
    config.REFRESH_TOKEN_TTL as SignOptions["expiresIn"],
  ),
});

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.JWT_ACCESS_SECRET) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.JWT_REFRESH_SECRET) as TokenPayload;
