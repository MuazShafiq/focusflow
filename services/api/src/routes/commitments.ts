import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler.js";
import { ApiError } from "../lib/errors.js";
import { serialize } from "../lib/serialize.js";
import { CommitmentModel } from "../models/Commitment.js";

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");
const commitmentInput = z
  .object({
    title: z.string().trim().min(1).max(160),
    category: z.string().trim().min(1).max(60).default("Commitment"),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    recurrence: z.enum(["none", "weekly"]).default("none"),
    recurrenceDays: z
      .array(z.coerce.number().int().min(0).max(6))
      .max(7)
      .default([]),
  })
  .refine((value) => value.endAt > value.startAt, {
    message: "End time must be after start time",
    path: ["endAt"],
  })
  .refine(
    (value) =>
      value.recurrence !== "weekly" || value.recurrenceDays.length > 0,
    {
      message: "Choose at least one repeat day",
      path: ["recurrenceDays"],
    },
  )
  .transform((value) => ({
    ...value,
    recurrenceDays:
      value.recurrence === "weekly"
        ? [...new Set(value.recurrenceDays)].sort()
        : [],
  }));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const from = req.query.from ? new Date(String(req.query.from)) : new Date();
    const to = req.query.to
      ? new Date(String(req.query.to))
      : new Date(from.getTime() + 14 * 86_400_000);
    const commitments = await CommitmentModel.find({
      userId: req.userId,
      $or: [
        { recurrence: "weekly", startAt: { $lt: to } },
        {
          recurrence: { $ne: "weekly" },
          startAt: { $lt: to },
          endAt: { $gt: from },
        },
      ],
    }).sort({ startAt: 1 });
    res.json({ data: serialize(commitments) });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = commitmentInput.parse(req.body);
    const commitment = await CommitmentModel.create({
      ...input,
      userId: req.userId,
    });
    res.status(201).json({ data: serialize(commitment) });
  }),
);

router.patch(
  "/:commitmentId",
  asyncHandler(async (req, res) => {
    const commitmentId = objectId.parse(req.params.commitmentId);
    const existing = await CommitmentModel.findOne({
      _id: commitmentId,
      userId: req.userId,
    });
    if (!existing) {
      throw new ApiError(404, "Commitment was not found");
    }

    const candidate = commitmentInput.parse({
      title: req.body.title ?? existing.title,
      category: req.body.category ?? existing.category,
      startAt: req.body.startAt ?? existing.startAt,
      endAt: req.body.endAt ?? existing.endAt,
      recurrence: req.body.recurrence ?? existing.recurrence,
      recurrenceDays: req.body.recurrenceDays ?? existing.recurrenceDays,
    });
    Object.assign(existing, candidate);
    await existing.save();
    res.json({ data: serialize(existing) });
  }),
);

router.delete(
  "/:commitmentId",
  asyncHandler(async (req, res) => {
    const commitmentId = objectId.parse(req.params.commitmentId);
    const commitment = await CommitmentModel.findOneAndDelete({
      _id: commitmentId,
      userId: req.userId,
    });
    if (!commitment) {
      throw new ApiError(404, "Commitment was not found");
    }
    res.status(204).send();
  }),
);

export default router;
