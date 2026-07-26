import { Schema, model } from "mongoose";

const feedbackSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    blockId: { type: Schema.Types.ObjectId, required: true },
    outcome: {
      type: String,
      enum: ["completed", "skipped", "rescheduled"],
      required: true,
    },
    actualMinutes: { type: Number, min: 0, max: 1440 },
    energyRating: { type: Number, min: 1, max: 5 },
    satisfaction: { type: Number, min: 1, max: 5 },
    plannedStartAt: { type: Date, required: true },
    blockType: { type: String, required: true },
  },
  { timestamps: true },
);

export const FeedbackModel = model("Feedback", feedbackSchema);
