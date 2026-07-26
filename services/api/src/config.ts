import "dotenv/config";
import { z } from "zod";

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z
    .string()
    .min(1)
    .default("mongodb://127.0.0.1:27017/focusflow"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(32)
    .default("development-access-secret-change-me-now"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32)
    .default("development-refresh-secret-change-me"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  WEB_ORIGIN: z.string().default("http://localhost:5173"),
  SCHEDULER_URL: z.string().url().default("http://127.0.0.1:5001"),
  SCHEDULER_SERVICE_TOKEN: z
    .string()
    .min(16)
    .default("development-scheduler-token"),
});

export const config = environmentSchema.parse(process.env);
