import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler.js";
import { ApiError } from "../lib/errors.js";
import { serialize } from "../lib/serialize.js";
import { UserModel } from "../models/User.js";

const router = Router();
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const preferencesInput = z.object({
  timezone: z.string().min(1).max(100),
  dayStart: z.string().regex(timePattern),
  dayEnd: z.string().regex(timePattern),
  focusSessionMinutes: z.coerce.number().int().min(20).max(120),
  shortBreakMinutes: z.coerce.number().int().min(5).max(30),
  preferredStudyTime: z.enum(["morning", "afternoon", "evening"]),
  energyByTime: z.object({
    morning: z.coerce.number().min(0).max(1),
    afternoon: z.coerce.number().min(0).max(1),
    evening: z.coerce.number().min(0).max(1),
  }),
  exerciseMinutesPerWeek: z.coerce.number().int().min(0).max(840),
  leisureMinutesPerDay: z.coerce.number().int().min(0).max(240),
  autoScheduleLifestyle: z.boolean(),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.userId);
    if (!user) {
      throw new ApiError(404, "User was not found");
    }
    res.json({ data: serialize(user.preferences) });
  }),
);

router.put(
  "/",
  asyncHandler(async (req, res) => {
    const preferences = preferencesInput.parse(req.body);
    const user = await UserModel.findByIdAndUpdate(
      req.userId,
      { preferences },
      { new: true, runValidators: true },
    );
    if (!user) {
      throw new ApiError(404, "User was not found");
    }
    res.json({ data: serialize(user.preferences) });
  }),
);

export default router;
