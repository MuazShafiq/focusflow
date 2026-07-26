import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler.js";
import { ApiError } from "../lib/errors.js";
import { serialize } from "../lib/serialize.js";
import {
  createTokenPair,
  verifyRefreshToken,
} from "../lib/tokens.js";
import { requireAuth } from "../middleware/auth.js";
import { UserModel } from "../models/User.js";

const router = Router();

const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
});

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = credentialsSchema
      .extend({
        displayName: z.string().trim().min(2).max(80),
        timezone: z.string().trim().min(1).default("UTC"),
      })
      .parse(req.body);

    if (await UserModel.exists({ email: input.email })) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const user = await UserModel.create({
      email: input.email,
      displayName: input.displayName,
      passwordHash: await bcrypt.hash(input.password, 12),
      preferences: { timezone: input.timezone },
    });

    res.status(201).json({
      data: {
        user: serialize(user),
        ...createTokenPair(user.id, user.tokenVersion),
      },
    });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = credentialsSchema.parse(req.body);
    const user = await UserModel.findOne({ email: input.email }).select(
      "+passwordHash",
    );

    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new ApiError(401, "Email or password is incorrect");
    }

    res.json({
      data: {
        user: serialize(user),
        ...createTokenPair(user.id, user.tokenVersion),
      },
    });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = z
      .object({ refreshToken: z.string().min(1) })
      .parse(req.body);

    try {
      const payload = verifyRefreshToken(refreshToken);
      if (payload.type !== "refresh") {
        throw new Error("Incorrect token type");
      }

      const user = await UserModel.findById(payload.sub);
      if (!user || user.tokenVersion !== payload.tokenVersion) {
        throw new Error("Token has been revoked");
      }

      res.json({
        data: createTokenPair(user.id, user.tokenVersion),
      });
    } catch {
      throw new ApiError(401, "The refresh token is invalid or expired");
    }
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      throw new ApiError(404, "User was not found");
    }
    res.json({ data: serialize(user) });
  }),
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await UserModel.findByIdAndUpdate(req.userId, { $inc: { tokenVersion: 1 } });
    res.status(204).send();
  }),
);

export default router;
