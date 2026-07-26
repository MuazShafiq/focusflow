import { describe, expect, it } from "vitest";
import {
  createTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
} from "./tokens.js";

describe("token helpers", () => {
  it("creates typed access and refresh tokens", () => {
    const tokens = createTokenPair("user-123", 2);
    expect(verifyAccessToken(tokens.accessToken)).toMatchObject({
      sub: "user-123",
      tokenVersion: 2,
      type: "access",
    });
    expect(verifyRefreshToken(tokens.refreshToken)).toMatchObject({
      sub: "user-123",
      tokenVersion: 2,
      type: "refresh",
    });
  });
});
