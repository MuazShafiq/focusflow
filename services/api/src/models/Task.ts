import { Schema, model } from "mongoose";

const taskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: "" },
    category: { type: String, default: "Study", trim: true },
    dueAt: { type: Date, required: true, index: true },
    estimatedMinutes: { type: Number, required: true, min: 15, max: 2400 },
    remainingMinutes: { type: Number, required: true, min: 0, max: 2400 },
    priority: { type: Number, default: 3, min: 1, max: 5 },
    difficulty: { type: Number, default: 3, min: 1, max: 5 },
    preferredTimeOfDay: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed", "archived"],
      default: "todo",
      index: true,
    },
    completedAt: Date,
  },
  { timestamps: true },
);

taskSchema.index({ userId: 1, status: 1, dueAt: 1 });

export const TaskModel = model("Task", taskSchema);
