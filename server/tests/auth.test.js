import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../src/app.js";
import db from "#db/index.js";
import { resetDb } from "./helpers/db.js";

async function signupAndLogin(username, password = "secret123") {
  await request(app).post("/api/auth/signup").send({
    username,
    password,
    name: "Test",
    surname: "User",
  });

  const loginRes = await request(app).post("/api/auth/login").send({
    username,
    password,
  });

  return loginRes.body.payload;
}

describe("Auth API", () => {
  beforeAll(async () => {
    await db.sequelize.authenticate();
  });

  beforeEach(async () => {
    await resetDb(db.sequelize);
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it("signup -> login returns JWT token", async () => {
    const token = await signupAndLogin("auth_test_user");
    expect(token).toBeTypeOf("string");
    expect(token.length).toBeGreaterThan(20);
  });

  it("GET /api/auth/user returns current user", async () => {
    const token = await signupAndLogin("auth_user_self");
    const res = await request(app)
      .get("/api/auth/user")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.payload.username).toBe("auth_user_self");
  });
});
