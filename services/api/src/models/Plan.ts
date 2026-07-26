import { Schema, model } from "mongoose";

const blockSchema = new Schema(
  {
    sourceId: String,
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ["task", "commitment", "exercise", "meal", "break", "leisure"],
      required: true,
    },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    locked: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["planned", "completed", "skipped", "rescheduled"],
      default: "planned",
    },
    rationale: { type: String, default: "" },
    score: Number,
  },
  { timestamps: true },
);

const planSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rangeStart: { type: Date, required: true },
    rangeEnd: { type: Date, required: true },
    modelVersion: { type: String, required: true },
    blocks: { type: [blockSchema], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

planSchema.index({ userId: 1, active: 1, createdAt: -1 });

export const PlanModel = model("Plan", planSchema);
