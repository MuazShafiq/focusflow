import { Router } from "express";
import { z } from "zod";
import { config } from "../config.js";
import { asyncHandler } from "../lib/async-handler.js";
import { ApiError } from "../lib/errors.js";
import { expandCommitments } from "../lib/expand-commitments.js";
import { expandTasks } from "../lib/expand-tasks.js";
import { serialize } from "../lib/serialize.js";
import { CommitmentModel } from "../models/Commitment.js";
import { FeedbackModel } from "../models/Feedback.js";
import { PlanModel } from "../models/Plan.js";
import { TaskModel } from "../models/Task.js";
import { UserModel } from "../models/User.js";

const router = Router();
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid identifier");

const schedulerResponse = z.object({
  modelVersion: z.string(),
  blocks: z.array(
    z.object({
      sourceId: z.string().optional(),
      title: z.string(),
      type: z.enum([
        "task",
        "commitment",
        "exercise",
        "meal",
        "break",
        "leisure",
      ]),
      startAt: z.coerce.date(),
      endAt: z.coerce.date(),
      locked: z.boolean().default(false),
      status: z
        .enum(["planned", "completed", "skipped", "rescheduled"])
        .default("planned"),
      rationale: z.string(),
      score: z.number().optional(),
    }),
  ),
});

router.get(
  "/current",
  asyncHandler(async (req, res) => {
    const plan = await PlanModel.findOne({
      userId: req.userId,
      active: true,
    }).sort({ createdAt: -1 });
    res.json({ data: plan ? serialize(plan) : null });
  }),
);

router.post(
  "/generate",
  asyncHandler(async (req, res) => {
    const input = z
      .object({
        rangeStart: z.coerce.date(),
        rangeEnd: z.coerce.date(),
      })
      .refine(
        (value) =>
          value.rangeEnd > value.rangeStart &&
          value.rangeEnd.getTime() - value.rangeStart.getTime() <=
            14 * 86_400_000,
        { message: "Plan range must be between one and fourteen days" },
      )
      .parse(req.body);

    const [user, tasks, commitments, previousPlan, recentFeedback] =
      await Promise.all([
        UserModel.findById(req.userId),
        TaskModel.find({
          userId: req.userId,
          status: { $in: ["todo", "in_progress"] },
          remainingMinutes: { $gt: 0 },
        }).sort({ dueAt: 1, priority: -1 }),
        CommitmentModel.find({
          userId: req.userId,
          $or: [
            { recurrence: "weekly", startAt: { $lt: input.rangeEnd } },
            {
              recurrence: { $ne: "weekly" },
              startAt: { $lt: input.rangeEnd },
              endAt: { $gt: input.rangeStart },
            },
          ],
        }),
        PlanModel.findOne({ userId: req.userId, active: true }).sort({
          createdAt: -1,
        }),
        FeedbackModel.find({ userId: req.userId, blockType: "task" })
          .sort({ createdAt: -1 })
          .limit(200),
      ]);

    if (!user) {
      throw new ApiError(404, "User was not found");
    }

    const learningProfile = {
      morning: { completed: 0, total: 0 },
      afternoon: { completed: 0, total: 0 },
      evening: { completed: 0, total: 0 },
    };
    const hourFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hourCycle: "h23",
      timeZone: user.preferences.timezone,
    });
    for (const item of recentFeedback) {
      const hour = Number(hourFormatter.format(item.plannedStartAt));
      const bucket =
        hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
      learningProfile[bucket].total += 1;
      if (item.outcome === "completed") {
        learningProfile[bucket].completed += 1;
      }
    }

    let response: Response;
    try {
      response = await fetch(`${config.SCHEDULER_URL}/v1/schedules/generate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-service-token": config.SCHEDULER_SERVICE_TOKEN,
        },
        body: JSON.stringify({
          rangeStart: input.rangeStart,
          rangeEnd: input.rangeEnd,
          preferences: user.preferences,
          tasks: expandTasks(
            tasks.map((task) => ({
              id: task.id,
              title: task.title,
              category: task.category,
              dueAt: task.dueAt,
              estimatedMinutes: task.estimatedMinutes,
              remainingMinutes: task.remainingMinutes,
              priority: task.priority,
              difficulty: task.difficulty,
              preferredTimeOfDay: task.preferredTimeOfDay ?? undefined,
              recurrence: task.recurrence,
            })),
            input.rangeStart,
            input.rangeEnd,
          ),
          commitments: expandCommitments(
            commitments.map((commitment) => ({
              id: commitment.id,
              title: commitment.title,
              startAt: commitment.startAt,
              endAt: commitment.endAt,
              category: commitment.category,
              recurrence: commitment.recurrence,
              recurrenceDays: commitment.recurrenceDays,
            })),
            input.rangeStart,
            input.rangeEnd,
            user.preferences.timezone,
          ),
          lockedBlocks:
            previousPlan?.blocks
              .filter(
                (block) =>
                  block.locked &&
                  !(
                    block.sourceId &&
                    ["commitment", "exercise"].includes(block.type)
                  ),
              )
              .map((block) => ({
                sourceId: block.sourceId,
                title: block.title,
                type: block.type,
                startAt: block.startAt,
                endAt: block.endAt,
                locked: true,
              })) ?? [],
          learningProfile: Object.fromEntries(
            Object.entries(learningProfile).map(([bucket, values]) => [
              bucket,
              values.total ? values.completed / values.total : 0.5,
            ]),
          ),
        }),
        signal: AbortSignal.timeout(45_000),
      });
    } catch {
      throw new ApiError(
        503,
        "The scheduling service is unavailable. Please try again shortly.",
      );
    }

    if (!response.ok) {
      throw new ApiError(502, "The scheduling service could not create a plan");
    }

    const schedule = schedulerResponse.parse(await response.json());
    await PlanModel.updateMany(
      { userId: req.userId, active: true },
      { active: false },
    );
    const plan = await PlanModel.create({
      userId: req.userId,
      rangeStart: input.rangeStart,
      rangeEnd: input.rangeEnd,
      modelVersion: schedule.modelVersion,
      blocks: schedule.blocks,
    });

    res.status(201).json({ data: serialize(plan) });
  }),
);

router.patch(
  "/:planId/blocks/:blockId/lock",
  asyncHandler(async (req, res) => {
    const planId = objectId.parse(req.params.planId);
    const blockId = objectId.parse(req.params.blockId);
    const { locked } = z.object({ locked: z.boolean() }).parse(req.body);
    const plan = await PlanModel.findOneAndUpdate(
      { _id: planId, userId: req.userId, "blocks._id": blockId },
      { $set: { "blocks.$.locked": locked } },
      { new: true },
    );
    if (!plan) {
      throw new ApiError(404, "Schedule block was not found");
    }
    res.json({ data: serialize(plan) });
  }),
);

router.post(
  "/:planId/blocks/:blockId/feedback",
  asyncHandler(async (req, res) => {
    const planId = objectId.parse(req.params.planId);
    const blockId = objectId.parse(req.params.blockId);
    const feedback = z
      .object({
        outcome: z.enum(["completed", "skipped", "rescheduled"]),
        actualMinutes: z.coerce.number().int().min(0).max(1440).optional(),
        energyRating: z.coerce.number().int().min(1).max(5).optional(),
        satisfaction: z.coerce.number().int().min(1).max(5).optional(),
      })
      .parse(req.body);

    const plan = await PlanModel.findOneAndUpdate(
      { _id: planId, userId: req.userId, "blocks._id": blockId },
      { $set: { "blocks.$.status": feedback.outcome } },
      { new: true },
    );
    if (!plan) {
      throw new ApiError(404, "Schedule block was not found");
    }

    await FeedbackModel.create({
      ...feedback,
      userId: req.userId,
      planId,
      blockId,
      plannedStartAt: plan.blocks.id(blockId)?.startAt,
      blockType: plan.blocks.id(blockId)?.type,
    });
    res.status(201).json({ data: serialize(plan) });
  }),
);

export default router;
