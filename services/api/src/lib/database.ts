import mongoose from "mongoose";
import { config } from "../config.js";

let connectionPromise: Promise<typeof mongoose> | undefined;

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  connectionPromise ??= mongoose.connect(config.MONGODB_URI).catch((error) => {
    connectionPromise = undefined;
    throw error;
  });

  return connectionPromise;
};
