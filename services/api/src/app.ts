import cors from "cors";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import mongoose from "mongoose";
import { pinoHttp } from "pino-http";
import { config } from "./config.js";
import { connectDatabase } from "./lib/database.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import { requireAuth } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import commitmentRoutes from "./routes/commitments.js";
import planRoutes from "./routes/plans.js";
import preferencesRoutes from "./routes/preferences.js";
import taskRoutes from "./routes/tasks.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  if (config.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  app.use(helmet());
  app.use(
    cors({
      origin: config.WEB_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: false,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(
    pinoHttp({
      redact: ["req.headers.authorization", "req.headers.cookie"],
    }),
  );
  app.use(async (_req, _res, next) => {
    try {
      await connectDatabase();
      next();
    } catch (error) {
      next(error);
    }
  });

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "focusflow-api",
      database:
        mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
  });

  app.use(
    "/api/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 40,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
    authRoutes,
  );
  app.use("/api/tasks", requireAuth, taskRoutes);
  app.use("/api/commitments", requireAuth, commitmentRoutes);
  app.use("/api/preferences", requireAuth, preferencesRoutes);
  app.use("/api/plans", requireAuth, planRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};
