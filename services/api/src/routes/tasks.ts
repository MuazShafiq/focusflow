import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../lib/async-handler.js";
import { ApiError } from "../lib/errors.js";
import { serialize } from "../lib/serialize.js";
import { TaskModel } from "../models/Task.js";

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");

const taskInput = z.object({
  title: z.string().trim().min(1).max(160),
  notes: z.string().max(4000).default(""),
  category: z.string().trim().min(1).max(60).default("Study"),
  dueAt: z.coerce.date(),
  estimatedMinutes: z.coerce.number().int().min(15).max(2400),
  priority: z.coerce.number().int().min(1).max(5).default(3),
  difficulty: z.coerce.number().int().min(1).max(5).default(3),
  preferredTimeOfDay: z
    .enum(["morning", "afternoon", "evening"])
    .optional(),
  recurrence: z
    .enum(["none", "daily", "weekdays", "weekly"])
    .default("none"),
});

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const status = z
      .enum(["todo", "in_progress", "completed", "archived"])
      .optional()
      .parse(req.query.status);
    const query = { userId: req.userId, ...(status ? { status } : {}) };
    const tasks = await TaskModel.find(query).sort({ dueAt: 1, priority: -1 });
    res.json({ data: serialize(tasks) });
  }),
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = taskInput.parse(req.body);
    const task = await TaskModel.create({
      ...input,
      userId: req.userId,
      remainingMinutes: input.estimatedMinutes,
    });
    res.status(201).json({ data: serialize(task) });
  }),
);

router.patch(
  "/:taskId",
  asyncHandler(async (req, res) => {
    const taskId = objectId.parse(req.params.taskId);
    const input = taskInput
      .partial()
      .extend({
        remainingMinutes: z.coerce.number().int().min(0).max(2400).optional(),
        status: z
          .enum(["todo", "in_progress", "completed", "archived"])
          .optional(),
      })
      .parse(req.body);

    const update = {
      ...input,
      ...(input.status === "completed" ? { completedAt: new Date() } : {}),
    };
    const task = await TaskModel.findOneAndUpdate(
      { _id: taskId, userId: req.userId },
      update,
      { new: true, runValidators: true },
    );
    if (!task) {
      throw new ApiError(404, "Task was not found");
    }
    res.json({ data: serialize(task) });
  }),
);

router.delete(
  "/:taskId",
  asyncHandler(async (req, res) => {
    const taskId = objectId.parse(req.params.taskId);
    const task = await TaskModel.findOneAndDelete({
      _id: taskId,
      userId: req.userId,
    });
    if (!task) {
      throw new ApiError(404, "Task was not found");
    }
    res.status(204).send();
  }),
);

export default router;
