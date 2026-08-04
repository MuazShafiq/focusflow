import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const start = async () => {
  const database = await MongoMemoryServer.create({
    instance: { dbName: "focusflow-local" },
  });
  process.env.MONGODB_URI = database.getUri();

  const [{ createApp }, { config }, { connectDatabase }] = await Promise.all([
    import("./app.js"),
    import("./config.js"),
    import("./lib/database.js"),
  ]);

  await connectDatabase();
  const server = createApp().listen(config.PORT, () => {
    console.log(
      `FocusFlow local API listening on http://localhost:${config.PORT}`,
    );
    console.log("Using an isolated temporary MongoDB database.");
  });

  const shutdown = async () => {
    server.close();
    await mongoose.disconnect();
    await database.stop();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
};

start().catch((error) => {
  console.error("Failed to start the local FocusFlow API", error);
  process.exit(1);
});
