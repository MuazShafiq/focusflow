import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("authentication and synchronized task flow", () => {
  let database: MongoMemoryServer;
  const app = createApp();

  beforeAll(async () => {
    database = await MongoMemoryServer.create();
    await mongoose.connect(database.getUri());
  }, 120_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await database.stop();
  });

  it("keeps each user's tasks private", async () => {
    const firstRegistration = await request(app).post("/api/auth/register").send({
      displayName: "Muaz",
      email: "muaz@example.com",
      password: "secure-test-password",
      timezone: "Asia/Karachi",
    });
    expect(firstRegistration.status).toBe(201);
    const firstToken = firstRegistration.body.data.accessToken as string;

    const task = await request(app)
      .post("/api/tasks")
      .set("authorization", `Bearer ${firstToken}`)
      .send({
        title: "Finish the scheduling engine",
        category: "Project",
        dueAt: new Date(Date.now() + 86_400_000).toISOString(),
        estimatedMinutes: 120,
        priority: 5,
        difficulty: 4,
      });
    expect(task.status).toBe(201);
    expect(task.body.data).toMatchObject({
      title: "Finish the scheduling engine",
      remainingMinutes: 120,
    });

    const secondRegistration = await request(app)
      .post("/api/auth/register")
      .send({
        displayName: "Another User",
        email: "another@example.com",
        password: "another-secure-password",
        timezone: "UTC",
      });
    const secondToken = secondRegistration.body.data.accessToken as string;
    const secondUsersTasks = await request(app)
      .get("/api/tasks")
      .set("authorization", `Bearer ${secondToken}`);

    expect(secondUsersTasks.status).toBe(200);
    expect(secondUsersTasks.body.data).toEqual([]);
  });
});
