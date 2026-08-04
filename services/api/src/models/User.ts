import { Schema, model } from "mongoose";

const preferencesSchema = new Schema(
  {
    timezone: { type: String, default: "UTC" },
    clockFormat: {
      type: String,
      enum: ["12h", "24h"],
      default: "12h",
    },
    dayStart: { type: String, default: "07:00" },
    dayEnd: { type: String, default: "23:00" },
    focusSessionMinutes: { type: Number, default: 50, min: 20, max: 120 },
    shortBreakMinutes: { type: Number, default: 10, min: 5, max: 30 },
    preferredStudyTime: {
      type: String,
      enum: ["morning", "afternoon", "evening"],
      default: "morning",
    },
    energyByTime: {
      morning: { type: Number, default: 0.9, min: 0, max: 1 },
      afternoon: { type: Number, default: 0.7, min: 0, max: 1 },
      evening: { type: Number, default: 0.5, min: 0, max: 1 },
    },
    exerciseMinutesPerWeek: { type: Number, default: 150, min: 0, max: 840 },
    leisureMinutesPerDay: { type: Number, default: 45, min: 0, max: 240 },
    autoScheduleLifestyle: { type: Boolean, default: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    displayName: { type: String, required: true, trim: true },
    tokenVersion: { type: Number, default: 0 },
    preferences: { type: preferencesSchema, default: () => ({}) },
  },
  { timestamps: true },
);

export const UserModel = model("User", userSchema);
