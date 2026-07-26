import { Schema, model } from "mongoose";

const commitmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "Commitment", trim: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
  },
  { timestamps: true },
);

commitmentSchema.index({ userId: 1, startAt: 1, endAt: 1 });

export const CommitmentModel = model("Commitment", commitmentSchema);
