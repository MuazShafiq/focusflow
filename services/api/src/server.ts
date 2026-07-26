import mongoose from "mongoose";
import { createApp } from "./app.js";
import { config } from "./config.js";

const start = async () => {
  await mongoose.connect(config.MONGODB_URI);
  const app = createApp();
  const server = app.listen(config.PORT, () => {
    console.log(`FocusFlow API listening on port ${config.PORT}`);
  });

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start().catch((error) => {
  console.error("Failed to start FocusFlow API", error);
  process.exit(1);
});
